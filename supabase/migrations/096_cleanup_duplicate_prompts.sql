-- =====================================================
-- Cleanup duplicate group_prompts for Wirthlin Family
-- Each day has 2 entries with same scheduled_for time.
-- Keep the one with responses, delete the empty duplicate.
-- Also dedup future prompts (keep one per timeslot).
-- =====================================================

-- Delete today's duplicate (the one with no responses)
DELETE FROM group_prompts
WHERE id = 'a2fc328c-8678-47f9-a776-2d364a647686';

-- Delete future duplicates for Wirthlin Family (keep one per timeslot using row_number)
DELETE FROM group_prompts
WHERE id IN (
  SELECT id FROM (
    SELECT gp.id,
           ROW_NUMBER() OVER (PARTITION BY gp.scheduled_for ORDER BY gp.created_at) as rn
    FROM group_prompts gp
    WHERE gp.group_id = '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf'
      AND gp.scheduled_for > now()
  ) dupes
  WHERE rn > 1
);

-- Also clean up past duplicates that have no responses (for all groups)
DELETE FROM group_prompts
WHERE id IN (
  SELECT gp.id
  FROM group_prompts gp
  LEFT JOIN responses r ON r.group_prompt_id = gp.id
  WHERE r.id IS NULL
    AND gp.expires_at < now()
    AND EXISTS (
      -- Only delete if there's another prompt for same group+timeslot that HAS responses
      SELECT 1 FROM group_prompts gp2
      JOIN responses r2 ON r2.group_prompt_id = gp2.id
      WHERE gp2.group_id = gp.group_id
        AND gp2.scheduled_for = gp.scheduled_for
        AND gp2.id != gp.id
    )
);
