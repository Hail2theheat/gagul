-- Add a new active photo prompt for testing

-- First ensure we have a photo prompt
INSERT INTO prompts (id, type, content, title, category, is_active)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'photo',
  'Show us what you''re doing right now!',
  'Right Now',
  'silly',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Create an active group_prompt for the first group
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  g.id,
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  now(),
  now() + interval '24 hours',
  date_trunc('week', now())::date,
  true
FROM groups g
LIMIT 1;
