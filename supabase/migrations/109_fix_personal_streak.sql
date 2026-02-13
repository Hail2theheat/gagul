-- Fix personal streak: add daily guard + recalculate corrupted streaks
--
-- Bug: increment_user_streak() fires on every response INSERT. If a user
-- is in 3 groups and responds to all 3 prompts in one day, their streak
-- goes up by 3 instead of 1. Migration 108 fixed the equivalent bug for
-- group streaks, but the personal streak function was never given a
-- daily guard.

-- 1. Rewrite increment_user_streak with a daily guard
CREATE OR REPLACE FUNCTION increment_user_streak(p_user_id UUID, p_group_prompt_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_streak INTEGER;
  v_last_date DATE;
BEGIN
  -- Check if already incremented today
  SELECT last_response_at::date INTO v_last_date
  FROM profiles WHERE id = p_user_id;

  IF v_last_date IS NOT NULL AND v_last_date >= CURRENT_DATE THEN
    -- Already counted today — just log the response, don't increment
    INSERT INTO response_log (user_id, group_prompt_id, streak_at_time)
    VALUES (p_user_id, p_group_prompt_id,
      (SELECT current_streak FROM profiles WHERE id = p_user_id))
    ON CONFLICT (user_id, group_prompt_id) DO NOTHING;

    SELECT current_streak INTO v_new_streak FROM profiles WHERE id = p_user_id;
    RETURN v_new_streak;
  END IF;

  -- First response today — increment streak
  UPDATE profiles
  SET
    current_streak = CASE
      WHEN last_response_at IS NULL THEN 1
      WHEN last_response_at::date = CURRENT_DATE - 1 THEN current_streak + 1
      ELSE 1  -- gap in days, restart at 1
    END,
    longest_streak = GREATEST(longest_streak,
      CASE
        WHEN last_response_at IS NULL THEN 1
        WHEN last_response_at::date = CURRENT_DATE - 1 THEN current_streak + 1
        ELSE 1
      END
    ),
    last_response_at = now()
  WHERE id = p_user_id
  RETURNING current_streak INTO v_new_streak;

  -- Log the response
  INSERT INTO response_log (user_id, group_prompt_id, streak_at_time)
  VALUES (p_user_id, p_group_prompt_id, v_new_streak)
  ON CONFLICT (user_id, group_prompt_id) DO NOTHING;

  RETURN v_new_streak;
END;
$$;

-- 2. One-time recalculation of all personal streaks from response_log history
WITH daily_responses AS (
  -- Collapse to one row per user per day
  SELECT user_id, responded_at::date AS response_date
  FROM response_log
  GROUP BY user_id, responded_at::date
),
numbered AS (
  -- Number each user's response days in reverse chronological order
  SELECT user_id, response_date,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY response_date DESC) AS rn
  FROM daily_responses
),
streak_calc AS (
  -- Current streak: count consecutive days walking back from today
  -- A day "counts" if response_date = CURRENT_DATE - (rn - 1)
  -- i.e. the most recent day is today (or yesterday), the next is the day before, etc.
  SELECT user_id, response_date, rn,
    CASE
      WHEN response_date = CURRENT_DATE - (rn - 1)::int THEN true
      WHEN rn = 1 AND response_date = CURRENT_DATE - 1 THEN true  -- streak still alive if last was yesterday
      ELSE false
    END AS is_consecutive
  FROM numbered
),
current_streaks AS (
  -- Count how many consecutive days from the most recent
  SELECT user_id,
    COUNT(*) FILTER (
      WHERE is_consecutive AND rn <= (
        -- find the first break point
        SELECT COALESCE(MIN(s2.rn), 999999)
        FROM streak_calc s2
        WHERE s2.user_id = streak_calc.user_id AND NOT s2.is_consecutive
      )
    ) AS calc_current_streak
  FROM streak_calc
  GROUP BY user_id
),
longest_streaks AS (
  -- Calculate longest streak from full history using gap-and-island
  SELECT user_id, MAX(streak_len) AS calc_longest_streak
  FROM (
    SELECT user_id, COUNT(*) AS streak_len
    FROM (
      SELECT user_id, response_date,
        response_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY response_date))::int AS grp
      FROM daily_responses
    ) islands
    GROUP BY user_id, grp
  ) streak_lengths
  GROUP BY user_id
)
UPDATE profiles p
SET
  current_streak = COALESCE(cs.calc_current_streak, 0),
  longest_streak = GREATEST(
    COALESCE(ls.calc_longest_streak, 0),
    COALESCE(cs.calc_current_streak, 0)
  )
FROM current_streaks cs
JOIN longest_streaks ls ON cs.user_id = ls.user_id
WHERE p.id = cs.user_id;
