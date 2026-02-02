UPDATE group_prompts SET is_active = false WHERE group_id = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';

INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of)
SELECT 
  '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf'::uuid,
  id,
  now(),
  now() + interval '24 hours',
  date_trunc('week', now())::date
FROM prompts
WHERE type = 'photo'
LIMIT 1;
