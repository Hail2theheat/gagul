// merge-photos edge function
// Takes two Supabase Storage photo paths (cutoff + completion),
// uses OpenAI to describe and generate a merged image,
// then uploads the result to Supabase Storage.
//
// DEPLOY: npx supabase functions deploy merge-photos
// REQUIRES: OPENAI_API_KEY secret set on the Supabase project

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MergeRequest {
  assignment_id: string
  original_photo_path: string
  completion_photo_path: string
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

    const body: MergeRequest = await req.json()
    const { assignment_id, original_photo_path, completion_photo_path } = body

    if (!assignment_id || !original_photo_path || !completion_photo_path) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Merging photos for assignment ${assignment_id}`)

    // Download both photos as base64
    const [originalData, completionData] = await Promise.all([
      downloadAsBase64(supabase, original_photo_path),
      downloadAsBase64(supabase, completion_photo_path),
    ])

    if (!originalData || !completionData) {
      return new Response(JSON.stringify({ error: 'Failed to download one or both photos' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Step 1: Use GPT-4o Vision to describe what the combined scene should look like
    console.log('Asking GPT-4o to describe merged scene...')
    const descriptionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'These two photos are the LEFT HALF and RIGHT HALF of one continuous image. In a party game, Person A took a photo with part of their body cut off at the right edge of the frame. Then Person B took a separate photo as the right half, creatively (and usually hilariously) continuing the scene from where Person A was cut off. Describe what a single merged panoramic photo combining these two halves side-by-side would look like. Focus on the funny juxtaposition where the two photos meet. The humor comes from Person B\'s absurd interpretation of what was just out of frame. Be vivid, emphasize the comedy, keep it under 100 words.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${originalData}` },
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${completionData}` },
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    })

    if (!descriptionResponse.ok) {
      const err = await descriptionResponse.text()
      console.error('GPT-4o description failed:', err)
      return new Response(JSON.stringify({ error: 'Failed to generate description' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const descResult = await descriptionResponse.json()
    const description = descResult.choices?.[0]?.message?.content || 'Two photos merged into one scene'
    console.log('Description:', description)

    // Step 2: Generate merged image with DALL-E (gpt-image-1)
    console.log('Generating merged image with gpt-image-1...')
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: `Generate a single wide panoramic photo that looks like two real photos stitched together into one continuous image. LEFT HALF and RIGHT HALF meet in the middle with a funny, absurd juxtaposition. Scene description: ${description}. Style: realistic casual phone photos, natural lighting, comedic and surprising where the two halves meet. The humor is in how ridiculous the "completion" half is compared to the original cutoff.`,
        n: 1,
        size: '1536x1024',
        output_format: 'png',
      }),
    })

    if (!imageResponse.ok) {
      const err = await imageResponse.text()
      console.error('Image generation failed:', err)
      return new Response(JSON.stringify({ error: 'Failed to generate merged image' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const imageResult = await imageResponse.json()
    const generatedImageB64 = imageResult.data?.[0]?.b64_json
    const generatedImageUrl = imageResult.data?.[0]?.url

    let mergedImageBytes: Uint8Array

    if (generatedImageB64) {
      // Convert base64 to bytes
      const binaryStr = atob(generatedImageB64)
      mergedImageBytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        mergedImageBytes[i] = binaryStr.charCodeAt(i)
      }
    } else if (generatedImageUrl) {
      // Download from URL
      const imgResp = await fetch(generatedImageUrl)
      mergedImageBytes = new Uint8Array(await imgResp.arrayBuffer())
    } else {
      return new Response(JSON.stringify({ error: 'No image data in response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Step 3: Upload merged image to Supabase Storage
    const storagePath = `photo-completion/merged/${assignment_id}.png`
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, mergedImageBytes, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(JSON.stringify({ error: 'Failed to upload merged image' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Step 4: Update assignment with merged photo URL
    const mergedUrl = storagePath
    const { error: updateError } = await supabase
      .from('photo_completion_assignments')
      .update({ merged_photo_url: mergedUrl })
      .eq('id', assignment_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update assignment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Successfully merged photos for assignment ${assignment_id}`)

    return new Response(JSON.stringify({
      success: true,
      assignment_id,
      merged_url: mergedUrl,
      description,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function downloadAsBase64(supabase: any, path: string): Promise<string | null> {
  try {
    // Path might be "responses/group_id/prompt_id/filename" — extract bucket and path
    const parts = path.split('/')
    const bucket = parts[0] || 'responses'
    const filePath = parts.slice(1).join('/')

    const { data, error } = await supabase.storage.from(bucket).download(filePath)
    if (error || !data) {
      console.error(`Download failed for ${path}:`, error)
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
    console.error(`Error downloading ${path}:`, e)
    return null
  }
}
