-- Add photo and video prompts to ALL groups (not just the first one)

-- First, deactivate any existing prompts for ALL groups
UPDATE group_prompts SET is_active = false;

-- Add photo prompt to ALL groups
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  g.id,
  '11111111-1111-1111-1111-111111111111',
  now(),
  now() + interval '24 hours',
  date_trunc('week', now())::date,
  true
FROM groups g;

-- Add video prompt to ALL groups
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  g.id,
  '22222222-2222-2222-2222-222222222222',
  now(),
  now() + interval '24 hours',
  date_trunc('week', now())::date,
  true
FROM groups g;
