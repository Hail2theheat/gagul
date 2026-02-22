-- Remove duplicate group_prompts (same prompt scheduled twice for same group/week)
-- Keep the earliest one by scheduled_for
DELETE FROM group_prompts
WHERE id IN (
  SELECT gp.id
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE (p.content ILIKE '%olympic%' OR p.title ILIKE '%olympic%')
    AND gp.id != (
      SELECT gp2.id
      FROM group_prompts gp2
      WHERE gp2.group_id = gp.group_id
        AND gp2.prompt_id = gp.prompt_id
        AND gp2.week_of = gp.week_of
      ORDER BY gp2.scheduled_for ASC
      LIMIT 1
    )
);

-- Also remove any general duplicates (same prompt_id + group_id + week_of)
DELETE FROM group_prompts
WHERE id NOT IN (
  SELECT DISTINCT ON (group_id, prompt_id, week_of) id
  FROM group_prompts
  ORDER BY group_id, prompt_id, week_of, scheduled_for ASC
);
