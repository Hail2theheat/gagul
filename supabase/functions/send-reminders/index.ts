// Supabase Edge Function to send reminder notifications
// Fires 5 hours after a prompt goes live for users who haven't responded
//
// DEPLOYMENT:
// supabase functions deploy send-reminders
//
// MANUAL TEST:
// curl -X POST https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-reminders

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  sound?: 'default' | null
  data?: Record<string, unknown>
}

interface PromptToRemind {
  group_prompt_id: string
  group_id: string
  group_name: string
  prompt_title: string
  prompt_type: string
}

interface PushToken {
  user_id: string
  token: string
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check for custom message in request body
    let customTitle: string | null = null
    let customBody: string | null = null
    let forceAll = false
    try {
      const body = await req.json()
      customTitle = body.title || null
      customBody = body.body || null
      forceAll = body.force_all || false
    } catch {
      // No body or invalid JSON, use defaults
    }

    let prompts: PromptToRemind[] | null = null
    let promptError: any = null

    if (forceAll) {
      // Get ALL currently active prompts (ignore reminder timing/flags)
      // Active = started today (within last 24h)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const result = await supabase
        .from('prompt_instances')
        .select(`
          id,
          group_id,
          groups!inner(name),
          prompts!inner(title, type)
        `)
        .gte('starts_at', yesterday)
        .lte('starts_at', new Date().toISOString())

      if (result.error) {
        promptError = result.error
      } else {
        prompts = (result.data || []).map((p: any) => ({
          group_prompt_id: p.id,
          group_id: p.group_id,
          group_name: p.groups?.name || 'Your group',
          prompt_title: p.prompts?.title || '',
          prompt_type: p.prompts?.type || '',
        }))
      }
    } else {
      // Standard: get prompts needing reminders (5+ hours old, not yet reminded)
      const result = await supabase.rpc('get_prompts_needing_reminder')
      prompts = result.data
      promptError = result.error
    }

    if (promptError) {
      console.error('Error fetching prompts for reminder:', promptError)
      return new Response(JSON.stringify({ error: promptError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const promptsToRemind = prompts as PromptToRemind[]

    if (!promptsToRemind || promptsToRemind.length === 0) {
      console.log('No prompts need reminders')
      return new Response(JSON.stringify({
        message: 'No prompts need reminders',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${promptsToRemind.length} prompts needing reminders`)

    // Collect notifications - only for users who haven't responded
    const notifications: PushMessage[] = []
    let totalPrompts = 0

    for (const prompt of promptsToRemind) {
      // Get push tokens for NON-responders only
      const { data: tokens, error: tokenError } = await supabase
        .rpc('get_non_responder_push_tokens', {
          p_group_prompt_id: prompt.group_prompt_id,
          p_group_id: prompt.group_id
        })

      if (tokenError || !tokens) {
        console.error(`Error fetching non-responder tokens for ${prompt.group_id}:`, tokenError)
        continue
      }

      const pushTokens = tokens as PushToken[]

      if (pushTokens.length === 0) {
        console.log(`Everyone responded in ${prompt.group_name}, no reminder needed`)
      } else {
        console.log(`${pushTokens.length} non-responders in ${prompt.group_name}`)

        for (const { token } of pushTokens) {
          notifications.push({
            to: token,
            title: customTitle || `⏰ ${prompt.group_name}`,
            body: customBody || "Don't be that guy. Answer the prompt bro",
            sound: 'default',
            data: { type: 'reminder' },
          })
        }
      }

      // Mark this prompt as reminded regardless
      await supabase.rpc('mark_prompt_reminded', {
        p_group_prompt_id: prompt.group_prompt_id,
        p_tokens_count: pushTokens.length
      })

      totalPrompts++
    }

    if (notifications.length === 0) {
      console.log('No reminders to send (everyone responded)')
      return new Response(JSON.stringify({
        success: true,
        promptsProcessed: totalPrompts,
        remindersSent: 0,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Sending ${notifications.length} reminder notifications`)

    let totalSent = 0

    // Send in batches of 100 (Expo limit)
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100)

      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(batch),
        })

        const result = await response.json()

        // Handle errors and remove invalid tokens
        if (result.data) {
          for (let j = 0; j < result.data.length; j++) {
            if (result.data[j].status === 'error') {
              console.error(`Push error: ${result.data[j].message}`)

              if (result.data[j].details?.error === 'DeviceNotRegistered' ||
                  result.data[j].details?.error === 'InvalidCredentials') {
                const invalidToken = batch[j].to
                await supabase
                  .from('push_tokens')
                  .delete()
                  .eq('token', invalidToken)
                console.log(`Removed invalid token: ${invalidToken.slice(0, 30)}...`)
              }
            }
          }
        }

        totalSent += batch.length
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
      }
    }

    const response = {
      success: true,
      promptsProcessed: totalPrompts,
      remindersSent: totalSent,
      timestamp: new Date().toISOString(),
    }

    console.log('Reminder run complete:', response)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({
      error: String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
