-- Add photo and video prompts for testing

-- Create photo prompt
INSERT INTO prompts (id, type, content, title, category, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'photo',
  'Show us your view right now!',
  'Your View',
  'silly',
  true
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- Create video prompt
INSERT INTO prompts (id, type, content, title, category, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'video',
  'Record a 10 second video of your current vibe!',
  'Vibe Check',
  'silly',
  true
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- Deactivate any existing active prompts for the group
UPDATE group_prompts SET is_active = false
WHERE group_id = (SELECT id FROM groups LIMIT 1);

-- Add photo prompt as active now
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  g.id,
  '11111111-1111-1111-1111-111111111111',
  now(),
  now() + interval '2 hours',
  date_trunc('week', now())::date,
  true
FROM groups g
LIMIT 1;

-- Add video prompt as active now (both available)
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  g.id,
  '22222222-2222-2222-2222-222222222222',
  now(),
  now() + interval '2 hours',
  date_trunc('week', now())::date,
  true
FROM groups g
LIMIT 1;
