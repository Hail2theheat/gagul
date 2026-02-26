// judge-tribunal edge function
// Takes a group_prompt_id (tribunal photo prompt), downloads all photos,
// sends them to GPT-4o vision for AI judge commentary, and caches the result.
//
// DEPLOY: npx supabase functions deploy judge-tribunal
// REQUIRES: OPENAI_API_KEY secret set on the Supabase project

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface JudgeRequest {
  group_prompt_id: string
  regenerate?: boolean
}

interface Annotation {
  type: 'line' | 'circle' | 'arrow' | 'label'
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  cx?: number
  cy?: number
  r?: number
  text?: string
  color?: string
}

interface JudgeEntry {
  user_id: string
  username: string
  photo_path: string
  score: number
  commentary: string[]
  annotations: Annotation[]
}

interface JudgeResult {
  entries: JudgeEntry[]
  nonSubmitters: { user_id: string; username: string }[]
  title: string
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: JudgeRequest = await req.json()
    const { group_prompt_id, regenerate } = body

    if (!group_prompt_id) {
      return new Response(JSON.stringify({ error: 'Missing group_prompt_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[judge-tribunal] Processing group_prompt ${group_prompt_id}, regenerate=${!!regenerate}`)

    // Check cache first (skip if regenerate)
    if (!regenerate) {
      const { data: cached } = await supabase
        .from('tribunal_judge_results')
        .select('result_json')
        .eq('group_prompt_id', group_prompt_id)
        .maybeSingle()

      if (cached?.result_json) {
        console.log('[judge-tribunal] Returning cached result')
        return new Response(JSON.stringify({
          success: true,
          cached: true,
          result: cached.result_json,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // 1. Fetch group_prompt to get prompt title/content and group_id
    const { data: gp, error: gpError } = await supabase
      .from('group_prompts')
      .select('id, group_id, prompt_id, prompts:prompt_id(title, content, type, payload)')
      .eq('id', group_prompt_id)
      .single()

    if (gpError || !gp) {
      return new Response(JSON.stringify({ error: 'Group prompt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prompt = (gp as any).prompts
    const promptTitle = prompt?.title || prompt?.content || 'Photo Challenge'
    const groupId = gp.group_id

    console.log(`[judge-tribunal] Prompt: "${promptTitle}", group: ${groupId}`)

    // 2. Fetch responses with media_url for this group_prompt
    const { data: responses, error: respError } = await supabase
      .from('responses')
      .select('id, user_id, media_url, content, submitted_at')
      .eq('group_prompt_id', group_prompt_id)
      .not('media_url', 'is', null)
      .order('submitted_at')

    if (respError || !responses || responses.length === 0) {
      return new Response(JSON.stringify({ error: 'No photo responses found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[judge-tribunal] Found ${responses.length} photo responses`)

    // 3. Fetch all group members to compute non-submitters
    const { data: members } = await supabase
      .from('group_members')
      .select('user_id, profiles:user_id(username)')
      .eq('group_id', groupId)

    const submitterIds = new Set(responses.map((r: any) => r.user_id))
    const nonSubmitters: { user_id: string; username: string }[] = []
    const memberUsernames: Record<string, string> = {}

    for (const m of members || []) {
      const username = (m as any).profiles?.username || 'Unknown'
      memberUsernames[m.user_id] = username
      if (!submitterIds.has(m.user_id)) {
        nonSubmitters.push({ user_id: m.user_id, username })
      }
    }

    // 4. Download each photo as base64
    const photoData: { user_id: string; username: string; photo_path: string; base64: string }[] = []

    for (const r of responses) {
      const username = memberUsernames[r.user_id] || 'Unknown'
      const base64 = await downloadAsBase64(supabase, r.media_url)
      if (base64) {
        photoData.push({
          user_id: r.user_id,
          username,
          photo_path: r.media_url,
          base64,
        })
      } else {
        console.warn(`[judge-tribunal] Failed to download photo for ${username}`)
      }
    }

    if (photoData.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not download any photos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[judge-tribunal] Downloaded ${photoData.length} photos, sending to GPT-4o...`)

    // 5. Build GPT-4o vision request — ALL photos in ONE call
    const imageContents = photoData.map((p, i) => ({
      type: 'image_url' as const,
      image_url: { url: `data:image/jpeg;base64,${p.base64}` },
    }))

    // Build the participant list for the prompt
    const participantList = photoData.map((p, i) => `Photo ${i + 1}: "${p.username}"`).join('\n')

    const systemPrompt = `You are TRIBUNAL-9000, an advanced photographic analysis AI. You judge photo challenges with deadpan, analytical precision mixed with dry absurd humor. You speak like a robot trying to understand human behavior — clinical observations mixed with hilariously wrong conclusions.

Your personality:
- Deadpan analytical robot that takes everything literally
- You "scan" and "detect" things in photos using pseudo-technical language
- You reference "calibration protocols" and "analysis subroutines"
- Your observations start clinical but spiral into absurd tangents
- You are confused by human customs but try to hide it
- You give decimal scores (like 6.47, not 6.5) to seem precise

IMPORTANT FORMATTING RULES:
- Each entry gets exactly 4-5 lines of commentary (NOT more)
- Each line should be a complete thought/observation
- Score each photo 0.00 to 10.00 with two decimal places
- Provide 3-5 annotations per photo using percentage coordinates (0-100)
- Annotations mark interesting things you noticed — ground level lines, measurement lines, circles around objects, labels for funny details
- Be FUNNY but in a dry, robotic way`

    const userPrompt = `Challenge: "${promptTitle}"

${photoData.length} participants submitted photos. Judge each one.

${participantList}

Respond with ONLY valid JSON in this exact format:
{
  "entries": [
    {
      "index": 0,
      "score": 7.23,
      "commentary": [
        "Line 1 of analysis...",
        "Line 2 of analysis...",
        "Line 3 of analysis...",
        "Line 4 of analysis..."
      ],
      "annotations": [
        { "type": "line", "x1": 10, "y1": 90, "x2": 90, "y2": 90, "text": "GROUND LEVEL" },
        { "type": "circle", "cx": 50, "cy": 40, "r": 15, "text": "SUBJECT" },
        { "type": "label", "cx": 70, "cy": 20, "text": "SUSPICIOUS OBJECT", "color": "#FF4444" }
      ]
    }
  ]
}

Rules:
- "index" matches the photo order (0-based)
- commentary must be exactly 4-5 strings per entry
- annotations: 3-5 per entry, using types: line, circle, arrow, label
- Coordinates are percentages (0-100) of the photo dimensions
- For lines/arrows: x1,y1 → x2,y2. For circles/labels: cx,cy (center), r (radius for circles)
- Score range: 0.00 to 10.00
- Return entries in order from LOWEST score to HIGHEST (worst to best)`

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              ...imageContents,
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0.9,
      }),
    })

    if (!gptResponse.ok) {
      const err = await gptResponse.text()
      console.error('[judge-tribunal] GPT-4o failed:', err)
      return new Response(JSON.stringify({ error: 'GPT-4o request failed', detail: err }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const gptResult = await gptResponse.json()
    const rawContent = gptResult.choices?.[0]?.message?.content || ''

    console.log('[judge-tribunal] Raw GPT response length:', rawContent.length)

    // 6. Parse JSON from GPT response (strip markdown fences if present)
    let parsed: any
    try {
      const jsonStr = rawContent.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
      parsed = JSON.parse(jsonStr)
    } catch (e) {
      console.error('[judge-tribunal] Failed to parse GPT JSON:', rawContent.substring(0, 500))
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: rawContent.substring(0, 1000) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 7. Merge GPT entries with known user_ids and photo_paths
    const entries: JudgeEntry[] = (parsed.entries || []).map((entry: any) => {
      const idx = entry.index
      const photo = photoData[idx]
      if (!photo) return null
      return {
        user_id: photo.user_id,
        username: photo.username,
        photo_path: photo.photo_path,
        score: typeof entry.score === 'number' ? entry.score : 0,
        commentary: Array.isArray(entry.commentary) ? entry.commentary : [],
        annotations: Array.isArray(entry.annotations) ? entry.annotations : [],
      }
    }).filter(Boolean) as JudgeEntry[]

    const result: JudgeResult = {
      entries,
      nonSubmitters,
      title: promptTitle,
    }

    console.log(`[judge-tribunal] Generated ${entries.length} entries, ${nonSubmitters.length} non-submitters`)

    // 8. Upsert into tribunal_judge_results
    const { error: upsertError } = await supabase
      .from('tribunal_judge_results')
      .upsert({
        group_prompt_id,
        result_json: result,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'group_prompt_id' })

    if (upsertError) {
      console.error('[judge-tribunal] Upsert error:', upsertError)
      return new Response(JSON.stringify({ error: 'Failed to save result', detail: upsertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('[judge-tribunal] Result saved successfully')

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      result,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[judge-tribunal] Unhandled error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function downloadAsBase64(supabase: any, path: string): Promise<string | null> {
  try {
    // Photos are stored in the 'uploads' bucket
    // Path format: "GROUP_ID/GP_ID/filename" or "uploads/GROUP_ID/..."
    let bucket = 'uploads'
    let filePath = path

    // If path starts with a known bucket name, strip it
    if (path.startsWith('uploads/')) {
      filePath = path.slice('uploads/'.length)
    } else if (path.startsWith('media/')) {
      bucket = 'media'
      filePath = path.slice('media/'.length)
    }

    const { data, error } = await supabase.storage.from(bucket).download(filePath)
    if (error || !data) {
      console.error(`[judge-tribunal] Download failed for ${path}:`, error)
      return null
    }

    const arrayBuffer = await data.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  } catch (e) {
    console.error(`[judge-tribunal] Error downloading ${path}:`, e)
    return null
  }
}
