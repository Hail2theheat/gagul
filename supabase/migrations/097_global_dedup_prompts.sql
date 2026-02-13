-- =====================================================
-- Global dedup: all groups have duplicate group_prompts
-- For each (group_id, scheduled_for), keep only ONE prompt.
-- Prefer the one with responses; otherwise keep earliest created.
-- =====================================================

-- Step 1: Delete duplicates for current/past prompts (keep the one with responses)
DELETE FROM group_prompts
WHERE id IN (
  SELECT gp.id
  FROM group_prompts gp
  LEFT JOIN responses r ON r.group_prompt_id = gp.id
  WHERE r.id IS NULL
    AND EXISTS (
      SELECT 1 FROM group_prompts gp2
      WHERE gp2.group_id = gp.group_id
        AND gp2.scheduled_for = gp.scheduled_for
        AND gp2.id != gp.id
    )
    AND gp.scheduled_for <= now()
);

-- Step 2: Delete duplicates for future prompts (keep first created per timeslot)
DELETE FROM group_prompts
WHERE id IN (
  SELECT id FROM (
    SELECT gp.id,
           ROW_NUMBER() OVER (
             PARTITION BY gp.group_id, gp.scheduled_for
             ORDER BY gp.created_at
           ) as rn
    FROM group_prompts gp
    WHERE gp.scheduled_for > now()
  ) dupes
  WHERE rn > 1
);
