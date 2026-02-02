-- Create a test quiplash assignment for solo testing
-- First, deactivate old quiplash prompts
UPDATE group_prompts SET is_active = false
WHERE group_id = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';

-- Create a new quiplash group_prompt
INSERT INTO group_prompts (id, group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
  '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf'::uuid,
  id,
  now(),
  now() + interval '24 hours',
  date_trunc('week', now())::date,
  true
FROM prompts
WHERE type = 'quiplash'
ORDER BY random()
LIMIT 1
ON CONFLICT (id) DO UPDATE SET is_active = true, expires_at = now() + interval '24 hours';

-- Get user ID and create assignment
INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
SELECT
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
  gm.user_id,
  'ffffffff-0000-1111-2222-333333333333'::uuid
FROM group_members gm
WHERE gm.group_id = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf'
ON CONFLICT (group_prompt_id, user_id) DO NOTHING;
