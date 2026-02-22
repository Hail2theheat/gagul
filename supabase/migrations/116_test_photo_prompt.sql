-- Test photo prompt for verifying upload fix
INSERT INTO prompts (title, content, type)
VALUES ('Photo Test', 'Show us what you see right now! Snap a photo of whatever is in front of you.', 'photo')
ON CONFLICT DO NOTHING;

-- Schedule it for the test group, active now
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, is_active, week_of)
SELECT
  '5646f359-b44b-4f6c-bdc4-77d3f5ace015',
  p.id,
  now(),
  now() + interval '24 hours',
  true,
  date_trunc('week', now())::date
FROM prompts p
WHERE p.content = 'Show us what you see right now! Snap a photo of whatever is in front of you.'
  AND p.type = 'photo'
LIMIT 1;

-- Deactivate other active prompts for this group so the new one shows
UPDATE group_prompts
SET is_active = false
WHERE group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
  AND is_active = true
  AND prompt_id != (
    SELECT p.id FROM prompts p
    WHERE p.content = 'Show us what you see right now! Snap a photo of whatever is in front of you.'
      AND p.type = 'photo'
    LIMIT 1
  );
