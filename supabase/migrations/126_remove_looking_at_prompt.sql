-- Remove the "show me what you are looking at right now" photo prompt from thugz group
-- Keep only procrastination and fridge photo prompts

-- Delete response_log entries first
DELETE FROM response_log
WHERE group_prompt_id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
    AND (p.content ILIKE '%looking at%' OR p.title ILIKE '%looking at%')
);

-- Delete responses
DELETE FROM responses
WHERE group_prompt_id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
    AND (p.content ILIKE '%looking at%' OR p.title ILIKE '%looking at%')
);

-- Delete notification_log
DELETE FROM notification_log
WHERE group_prompt_id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
    AND (p.content ILIKE '%looking at%' OR p.title ILIKE '%looking at%')
);

-- Delete the group_prompt itself
DELETE FROM group_prompts
WHERE id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = '5646f359-b44b-4f6c-bdc4-77d3f5ace015'
    AND p.type = 'photo'
    AND (p.content ILIKE '%looking at%' OR p.title ILIKE '%looking at%')
);
