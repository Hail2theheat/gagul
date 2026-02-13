-- Recalculate group streaks from actual prompt participation history.
-- Group streaks may be wrong from pre-108 double-processing bug.

WITH prompt_days AS (
  -- For each group, find dates where an expired prompt met 50%+ participation
  -- (include fireside comments + reactions per migration 108 logic)
  SELECT
    gp.group_id,
    gp.expires_at::date AS prompt_date,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = gp.group_id) AS total_members,
    (
      SELECT COUNT(DISTINCT p.user_id)
      FROM (
        SELECT r.user_id FROM responses r WHERE r.group_prompt_id = gp.id
        UNION
        SELECT fc.user_id FROM fireside_comments fc
          JOIN responses r ON r.id = fc.response_id
         WHERE r.group_prompt_id = gp.id
        UNION
        SELECT rr.user_id FROM response_reactions rr
          JOIN responses r ON r.id = rr.response_id
         WHERE r.group_prompt_id = gp.id
      ) p
      JOIN group_members gm ON gm.group_id = gp.group_id AND gm.user_id = p.user_id
    ) AS participants
  FROM group_prompts gp
  WHERE gp.expires_at < now()
    AND gp.is_active = true
),
met_days AS (
  -- Keep only days where threshold was met, collapse to one per group per day
  SELECT group_id, prompt_date
  FROM prompt_days
  WHERE participants::float >= total_members::float * 0.5
    AND total_members > 0
  GROUP BY group_id, prompt_date
),
with_groups AS (
  -- Gap-and-island: consecutive dates get the same group value
  SELECT group_id, prompt_date,
    prompt_date - (ROW_NUMBER() OVER (PARTITION BY group_id ORDER BY prompt_date))::int AS grp
  FROM met_days
),
streaks AS (
  SELECT group_id, grp,
    COUNT(*) AS streak_len,
    MAX(prompt_date) AS streak_end
  FROM with_groups
  GROUP BY group_id, grp
),
current_streaks AS (
  -- Current streak: the island ending today or yesterday (still alive)
  SELECT DISTINCT ON (group_id) group_id,
    streak_len AS calc_current_streak,
    streak_end AS calc_last_date
  FROM streaks
  WHERE streak_end >= CURRENT_DATE - 1
  ORDER BY group_id, streak_end DESC
),
longest_streaks AS (
  SELECT group_id, MAX(streak_len) AS calc_longest_streak
  FROM streaks
  GROUP BY group_id
)
UPDATE groups g
SET
  current_streak = COALESCE(cs.calc_current_streak, 0),
  longest_streak = GREATEST(
    COALESCE(ls.calc_longest_streak, 0),
    COALESCE(cs.calc_current_streak, 0)
  ),
  last_streak_date = COALESCE(cs.calc_last_date, g.last_streak_date)
FROM longest_streaks ls
LEFT JOIN current_streaks cs ON cs.group_id = ls.group_id
WHERE g.id = ls.group_id;
