-- Extend the meal photo prompt so testers can still do it today
-- Set it to expire tomorrow morning instead
UPDATE group_prompts gp
SET
  scheduled_for = now(),
  expires_at = '2026-02-05 12:00:00+00'::timestamptz
FROM prompts p
WHERE gp.prompt_id = p.id
AND p.title = 'Meal Photo'
AND gp.scheduled_for::date = '2026-02-04';
