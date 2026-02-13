-- Update prompt times (EST timezone = UTC-5)

-- Wednesday Feb 4 - Meal photo at noon EST (17:00 UTC)
UPDATE group_prompts gp
SET scheduled_for = '2026-02-04 17:00:00+00'::timestamptz
FROM prompts p
WHERE gp.prompt_id = p.id
AND p.title = 'Meal Photo'
AND gp.scheduled_for::date = '2026-02-04';

-- Thursday Feb 5 - Quiplash at 1 PM EST (18:00 UTC)
UPDATE group_prompts gp
SET scheduled_for = '2026-02-05 18:00:00+00'::timestamptz
FROM prompts p
WHERE gp.prompt_id = p.id
AND p.title IN ('Pinata Surprise', 'Jazz Inventor')
AND gp.scheduled_for::date = '2026-02-05';

-- Friday Feb 6 - Short text at 10 AM EST (15:00 UTC)
UPDATE group_prompts gp
SET scheduled_for = '2026-02-06 15:00:00+00'::timestamptz
FROM prompts p
WHERE gp.prompt_id = p.id
AND p.title = 'Secret Skill'
AND gp.scheduled_for::date = '2026-02-06';

-- Saturday Feb 7 - MC at 3 PM EST (20:00 UTC)
UPDATE group_prompts gp
SET scheduled_for = '2026-02-07 20:00:00+00'::timestamptz
FROM prompts p
WHERE gp.prompt_id = p.id
AND p.title = 'Eliminate One Forever'
AND gp.scheduled_for::date = '2026-02-07';
