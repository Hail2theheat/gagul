-- Resend the procrastinating and fridge photo prompts for the thugz group
-- Clear all existing responses so users can re-submit fresh photos
-- Group ID: 5646f359-b44b-4f6c-bdc4-77d3f5ace015

-- 1. Delete response_log entries for these photo prompts
DELETE FROM response_log
WHERE group_prompt_id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
);

-- 2. Delete responses for these photo prompts
DELETE FROM responses
WHERE group_prompt_id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
);

-- 3. Delete notification_log entries so they get re-sent
DELETE FROM notification_log
WHERE group_prompt_id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
);

-- 4. Reschedule: set scheduled_for to now so the next hourly cron picks them up
--    and extend expires_at so they stay active
UPDATE group_prompts
SET
  scheduled_for = now(),
  expires_at = now() + interval '24 hours',
  is_active = true
WHERE id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
);
