-- Fix streak recalculation: migration 109's current_streak calc was wrong
-- when the most recent response was yesterday (not today), the offset
-- formula was anchored to CURRENT_DATE and broke for all subsequent rows.
--
-- This uses a correct gap-and-island approach for both current and longest.

WITH daily_responses AS (
  -- Collapse to one row per user per day
  SELECT user_id, responded_at::date AS response_date
  FROM response_log
  GROUP BY user_id, responded_at::date
),
with_groups AS (
  -- Gap-and-island: consecutive dates get the same group value
  SELECT user_id, response_date,
    response_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY response_date))::int AS grp
  FROM daily_responses
),
streaks AS (
  -- Each island is a run of consecutive days
  SELECT user_id, grp,
    COUNT(*) AS streak_len,
    MAX(response_date) AS streak_end
  FROM with_groups
  GROUP BY user_id, grp
),
current_streaks AS (
  -- Current streak: the streak whose last day is today or yesterday (still alive)
  SELECT DISTINCT ON (user_id) user_id, streak_len AS calc_current_streak
  FROM streaks
  WHERE streak_end >= CURRENT_DATE - 1
  ORDER BY user_id, streak_end DESC
),
longest_streaks AS (
  SELECT user_id, MAX(streak_len) AS calc_longest_streak
  FROM streaks
  GROUP BY user_id
)
UPDATE profiles p
SET
  current_streak = COALESCE(cs.calc_current_streak, 0),
  longest_streak = GREATEST(
    COALESCE(ls.calc_longest_streak, 0),
    COALESCE(cs.calc_current_streak, 0)
  )
FROM longest_streaks ls
LEFT JOIN current_streaks cs ON cs.user_id = ls.user_id
WHERE p.id = ls.user_id;
