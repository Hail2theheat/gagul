// Supabase Edge Function to send push notifications when prompts go live
//
// DEPLOYMENT:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link project: supabase link --project-ref jssuzpodzgwfrpzmtpva
// 4. Deploy: supabase functions deploy send-notifications
//
// SCHEDULING (run in Supabase Dashboard SQL Editor):
// First enable pg_net extension in Database > Extensions
// Then run:
/*
SELECT cron.schedule(
  'send-prompt-notifications',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb
  );
  $$
);
*/
//
// MANUAL TEST:
// curl -X POST https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications \
//   -H "Authorization: Bearer YOUR_ANON_KEY"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  sound?: 'default' | null
  data?: Record<string, unknown>
}

interface PromptToNotify {
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

    // Get prompts that need notifications (uses our helper function)
    const { data: prompts, error: promptError } = await supabase
      .rpc('get_prompts_needing_notification')

    if (promptError) {
      console.error('Error fetching prompts:', promptError)
      return new Response(JSON.stringify({ error: promptError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const promptsToNotify = prompts as PromptToNotify[]

    if (!promptsToNotify || promptsToNotify.length === 0) {
      console.log('No new prompts to notify about')
      return new Response(JSON.stringify({
        message: 'No new prompts to notify about',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${promptsToNotify.length} prompts needing notifications`)

    // Collect all unique users who need notifications (dedupe across groups)
    const userNotifications = new Map<string, { token: string; groups: string[]; promptTitle: string; promptType: string }>()

    for (const prompt of promptsToNotify) {
      // Get push tokens for users in this group
      const { data: tokens, error: tokenError } = await supabase
        .rpc('get_group_push_tokens', { p_group_id: prompt.group_id })

      if (tokenError || !tokens) {
        console.error(`Error fetching tokens for group ${prompt.group_id}:`, tokenError)
        continue
      }

      const pushTokens = tokens as PushToken[]

      // Add users to map (deduplicating)
      for (const { user_id, token } of pushTokens) {
        if (userNotifications.has(user_id)) {
          // User already being notified, just add this group name
          userNotifications.get(user_id)!.groups.push(prompt.group_name)
        } else {
          userNotifications.set(user_id, {
            token,
            groups: [prompt.group_name],
            promptTitle: prompt.prompt_title,
            promptType: prompt.prompt_type
          })
        }
      }

      // Mark this prompt as notified
      await supabase.rpc('mark_prompt_notified', {
        p_group_prompt_id: prompt.group_prompt_id,
        p_tokens_count: pushTokens.length
      })
    }

    if (userNotifications.size === 0) {
      console.log('No users to notify')
      return new Response(JSON.stringify({
        success: true,
        promptsProcessed: promptsToNotify.length,
        notificationsSent: 0,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Build ONE notification per user
    const notifications: PushMessage[] = []
    for (const [userId, { token, groups, promptTitle, promptType }] of userNotifications) {
      const emoji = promptType === 'quiplash' ? '🎭' :
                    promptType === 'photo' ? '📸' :
                    promptType === 'video' ? '🎬' : '🔥'

      // If user is in multiple groups, make a combined message
      const title = groups.length > 1
        ? `${emoji} New prompts in ${groups.length} circles!`
        : `${emoji} New prompt in ${groups[0]}!`

      const body = promptTitle.length > 100
        ? promptTitle.slice(0, 97) + '...'
        : promptTitle

      notifications.push({
        to: token,
        title,
        body,
        sound: 'default',
        data: { type: 'new_prompt' },
      })
    }

    console.log(`Sending ${notifications.length} notifications (deduplicated by user)`)

    let totalNotificationsSent = 0
    const results: Record<string, unknown>[] = []

    // Send notifications in batches of 100 (Expo limit)
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

              // Remove invalid tokens
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

        totalNotificationsSent += batch.length
        results.push({ batch: i / 100 + 1, result })
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
      }
    }

    const response = {
      success: true,
      promptsProcessed: promptsToNotify.length,
      notificationsSent: totalNotificationsSent,
      timestamp: new Date().toISOString(),
    }

    console.log('Notification run complete:', response)

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
