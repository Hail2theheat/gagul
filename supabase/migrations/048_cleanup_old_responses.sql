-- Clean up ALL responses with media - we'll test fresh uploads
-- Also remove video/voice prompts to focus on photo only

-- Delete ALL responses that have media_url (photos, videos, voice)
DELETE FROM responses WHERE media_url IS NOT NULL;

-- Delete video group_prompts (keep photo only)
DELETE FROM group_prompts
WHERE prompt_id = '22222222-2222-2222-2222-222222222222';

-- Make sure photo prompt is still active
UPDATE group_prompts
SET is_active = true,
    expires_at = now() + interval '48 hours'
WHERE prompt_id = '11111111-1111-1111-1111-111111111111';
