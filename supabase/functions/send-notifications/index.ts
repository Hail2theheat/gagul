// Unified notification edge function for Stokie
//
// Called by pg_cron with a JSON body: { "type": "new_prompt" | "prompt_reminder" | "fireside_open" | "fireside_reminder" }
//
// Schedule (EST, cron in UTC):
//   M-Sat 2:00 PM  → new_prompt       → non-responders: "new prompt dropped"
//   M-Sat 8:30 PM  → prompt_reminder   → non-responders: "don't forget"
//   Sun   12:00 PM → fireside_open     → ALL users: "fireside is live"
//   Sun   9:00 PM  → fireside_reminder → users who haven't viewed fireside
//
// Manual override: POST with { "type": "...", "force_all": true, "title": "...", "body": "..." }
//   force_all = true  → send to ALL non-responders for active prompts (ignores cron timing)
//   title / body      → override default notification text
//
// DEPLOY: npx supabase functions deploy send-notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface PushMessage {
  to: string
  title: string
  body: string
  sound?: 'default' | null
  data?: Record<string, unknown>
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse notification type + optional overrides from request body
    let type = 'new_prompt'
    let forceAll = false
    let customTitle: string | null = null
    let customBody: string | null = null
    try {
      const body = await req.json()
      type = body.type || 'new_prompt'
      forceAll = body.force_all || false
      customTitle = body.title || null
      customBody = body.body || null
    } catch {
      // Default to new_prompt if no body
    }

    if (forceAll) {
      type = 'prompt_reminder'
    }

    console.log(`[send-notifications] type=${type} force_all=${forceAll} at ${new Date().toISOString()}`)

    const notifications: PushMessage[] = []

    if (type === 'new_prompt' || type === 'prompt_reminder') {
      // ─── M-Sat: Send to non-responders for today's prompts ───
      // Get all currently active, non-expired prompts
      const { data: activePrompts, error: promptErr } = await supabase
        .from('group_prompts')
        .select('id, group_id')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (promptErr) {
        console.error('Error fetching prompts:', promptErr)
        return jsonResponse({ error: promptErr.message }, 500)
      }

      if (!activePrompts || activePrompts.length === 0) {
        console.log('No active prompts')
        return jsonResponse({ message: 'No active prompts', type })
      }

      // Group prompts by group_id
      const promptsByGroup = new Map<string, string[]>()
      for (const gp of activePrompts) {
        if (!promptsByGroup.has(gp.group_id)) {
          promptsByGroup.set(gp.group_id, [])
        }
        promptsByGroup.get(gp.group_id)!.push(gp.id)
      }

      // For each group, find non-responders (dedupe per user)
      const userTokens = new Map<string, string>() // user_id -> token

      for (const [groupId, promptIds] of promptsByGroup) {
        // Get group members with push tokens
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId)

        if (!members || members.length === 0) continue

        // Check who has responded to ANY of this group's active prompts
        const { data: responses } = await supabase
          .from('responses')
          .select('user_id')
          .in('group_prompt_id', promptIds)

        const respondedIds = new Set((responses || []).map((r: any) => r.user_id))

        // Get tokens for non-responders
        const nonResponderIds = members
          .filter((m: any) => !respondedIds.has(m.user_id))
          .map((m: any) => m.user_id)

        if (nonResponderIds.length === 0) continue

        const { data: tokens } = await supabase
          .from('push_tokens')
          .select('user_id, token')
          .in('user_id', nonResponderIds)

        for (const t of (tokens || [])) {
          if (!userTokens.has(t.user_id)) {
            userTokens.set(t.user_id, t.token)
          }
        }
      }

      // Build ONE notification per user
      const title = customTitle || (type === 'new_prompt'
        ? '🔥 Stokie'
        : '⏰ Stokie')
      const body = customBody || (type === 'new_prompt'
        ? "You've got a new prompt! Stoke the fire before it burns out 🪵🔥"
        : "Your prompt is still waiting — don't let the fire die 🔥")

      for (const [, token] of userTokens) {
        notifications.push({ to: token, title, body, sound: 'default', data: { type } })
      }

    } else if (type === 'fireside_open') {
      // ─── Sunday 12 PM: Fireside open — ALL users ───
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('user_id, token')

      // Dedupe by user_id (some users may have multiple tokens)
      const seen = new Set<string>()
      for (const t of (tokens || [])) {
        if (seen.has(t.user_id)) continue
        seen.add(t.user_id)
        notifications.push({
          to: t.token,
          title: '🏕️ The Fireside is Open!',
          body: "Gather round! This week's Fireside is live — come see everyone's answers 🔥",
          sound: 'default',
          data: { type: 'fireside_open' },
        })
      }

    } else if (type === 'fireside_reminder') {
      // ─── Sunday 9 PM: Remind users who haven't viewed the fireside ───
      // Compute this week's week_of (the Monday of the week being reviewed)
      const now = new Date()
      // In ET, it's Sunday. The fireside reviews the week that just ended.
      // week_of = previous Monday = today - 6 days
      const sundayDate = new Date(now)
      // Adjust to ET midnight roughly (the exact date matters, not the time)
      const etOffset = -5 // EST; close enough for date calculation
      sundayDate.setHours(sundayDate.getHours() + (sundayDate.getTimezoneOffset() / 60) + etOffset)
      const prevMonday = new Date(sundayDate)
      prevMonday.setDate(sundayDate.getDate() - 6)
      const weekOf = prevMonday.toISOString().split('T')[0]

      console.log(`Fireside reminder: checking progress for week_of=${weekOf}`)

      // Get all groups
      const { data: groups } = await supabase
        .from('groups')
        .select('id')

      const usersWhoViewed = new Set<string>()

      // Check fireside_progress for each group
      for (const group of (groups || [])) {
        const { data: progress } = await supabase
          .from('fireside_progress')
          .select('user_id')
          .eq('group_id', group.id)
          .eq('week_of', weekOf)

        for (const p of (progress || [])) {
          usersWhoViewed.add(p.user_id)
        }
      }

      // Get all users with push tokens who HAVEN'T viewed
      const { data: allTokens } = await supabase
        .from('push_tokens')
        .select('user_id, token')

      const seen = new Set<string>()
      for (const t of (allTokens || [])) {
        if (seen.has(t.user_id)) continue
        if (usersWhoViewed.has(t.user_id)) continue // Skip users who already viewed
        seen.add(t.user_id)
        notifications.push({
          to: t.token,
          title: '🔥 Fireside Closing Soon',
          body: "Only a few hours left! Don't miss this week's moments before the fire goes out 🏕️",
          sound: 'default',
          data: { type: 'fireside_reminder' },
        })
      }
    }

    if (notifications.length === 0) {
      console.log(`No notifications to send for type=${type}`)
      return jsonResponse({ message: 'No notifications to send', type })
    }

    console.log(`Sending ${notifications.length} notifications for type=${type}`)

    // Send in batches of 100 (Expo limit)
    let sent = 0
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100)
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(batch),
        })
        const result = await response.json()

        // Clean up invalid tokens
        if (result.data) {
          for (let j = 0; j < result.data.length; j++) {
            if (result.data[j].status === 'error') {
              const errType = result.data[j].details?.error
              if (errType === 'DeviceNotRegistered' || errType === 'InvalidCredentials') {
                await supabase.from('push_tokens').delete().eq('token', batch[j].to)
                console.log(`Removed invalid token: ${batch[j].to.slice(0, 30)}...`)
              }
            }
          }
        }
        sent += batch.length
      } catch (fetchErr) {
        console.error('Expo push error:', fetchErr)
      }
    }

    console.log(`Done: sent ${sent} notifications for type=${type}`)
    return jsonResponse({ success: true, type, sent, timestamp: new Date().toISOString() })

  } catch (error) {
    console.error('Unexpected error:', error)
    return jsonResponse({ error: String(error) }, 500)
  }
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
