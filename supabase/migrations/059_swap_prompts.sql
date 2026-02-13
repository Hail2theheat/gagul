-- Swap meal photo and quiplash prompts
-- Wednesday (today): Quiplash x2
-- Thursday: Meal photo

-- Move quiplash to today (now, expires tomorrow at 1 PM EST = 18:00 UTC)
UPDATE group_prompts gp
SET
  scheduled_for = now(),
  expires_at = '2026-02-05 18:00:00+00'::timestamptz
FROM prompts p
WHERE gp.prompt_id = p.id
AND p.title IN ('Pinata Surprise', 'Jazz Inventor');

-- Move meal photo to Thursday 1 PM EST (18:00 UTC), expires Friday
UPDATE group_prompts gp
SET
  scheduled_for = '2026-02-05 18:00:00+00'::timestamptz,
  expires_at = '2026-02-06 15:00:00+00'::timestamptz
FROM prompts p
WHERE gp.prompt_id = p.id
AND p.title = 'Meal Photo';
