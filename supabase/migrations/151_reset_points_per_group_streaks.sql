-- ============================================================
-- 151: Reset Points, Per-Group Streaks, Per-Group Crown
--
-- 1. Wipe all points/winners before 2/23/26 (fresh start)
-- 2. Move streaks from profiles (global) to group_members (per-group)
-- 3. Crown determined from weekly_winners per-group (not global profile)
-- ============================================================

-- ============================================================
-- PART 1: Clear old data — fresh start from 2026-02-23
-- ============================================================

-- Delete all weekly points before the reset date
DELETE FROM weekly_points WHERE week_of < '2026-02-23';

-- Delete all weekly winners before the reset date
DELETE FROM weekly_winners WHERE week_of < '2026-02-23';

-- Delete all season winners (no completed seasons yet)
DELETE FROM season_winners;

-- Delete all response logs (streak history)
DELETE FROM response_log;

-- Reset global profile fields
UPDATE profiles SET
  current_streak = 0,
  longest_streak = 0,
  weekly_crown_until = NULL,
  total_points = 0,
  last_response_at = NULL;

-- ============================================================
-- PART 2: Per-group streaks on group_members
-- ============================================================

-- Add streak columns to group_members
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ;

-- Rewrite streak increment to be per-group
CREATE OR REPLACE FUNCTION increment_user_streak(p_user_id UUID, p_group_prompt_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
  v_new_streak INTEGER;
BEGIN
  -- Get the group_id from the group_prompt
  SELECT gp.group_id INTO v_group_id
  FROM group_prompts gp
  WHERE gp.id = p_group_prompt_id;

  IF v_group_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Update group_members streak (per-group, not global)
  UPDATE group_members
  SET
    current_streak = COALESCE(current_streak, 0) + 1,
    longest_streak = GREATEST(COALESCE(longest_streak, 0), COALESCE(current_streak, 0) + 1),
    last_response_at = now()
  WHERE user_id = p_user_id AND group_id = v_group_id
  RETURNING current_streak INTO v_new_streak;

  -- Log the response
  INSERT INTO response_log (user_id, group_prompt_id, streak_at_time)
  VALUES (p_user_id, p_group_prompt_id, COALESCE(v_new_streak, 0))
  ON CONFLICT (user_id, group_prompt_id) DO NOTHING;

  RETURN COALESCE(v_new_streak, 0);
END;
$$;

-- Rewrite streak break to be per-group-member
CREATE OR REPLACE FUNCTION check_and_break_streaks()
RETURNS TABLE(user_id UUID, old_streak INTEGER) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH expired_prompts AS (
    -- Find prompts that expired in the last 2 hours
    SELECT gp.id as group_prompt_id, gp.group_id
    FROM group_prompts gp
    WHERE gp.expires_at BETWEEN now() - interval '2 hours' AND now()
      AND gp.is_active = true
  ),
  members_who_missed AS (
    -- Find group members who didn't respond to their group's prompt
    SELECT DISTINCT gm.user_id, gm.group_id
    FROM expired_prompts ep
    JOIN group_members gm ON gm.group_id = ep.group_id
    LEFT JOIN responses r ON r.group_prompt_id = ep.group_prompt_id AND r.user_id = gm.user_id
    WHERE r.id IS NULL
  ),
  streak_breaks AS (
    -- Break streaks per-group (not global)
    UPDATE group_members gm
    SET current_streak = 0
    FROM members_who_missed mwm
    WHERE gm.user_id = mwm.user_id
      AND gm.group_id = mwm.group_id
      AND gm.current_streak > 0
    RETURNING gm.user_id, gm.current_streak as old_streak
  )
  SELECT sb.user_id, sb.old_streak FROM streak_breaks sb;
END;
$$;

-- ============================================================
-- PART 3: Remove global crown from finalize_week
-- Crown is now determined by querying weekly_winners per-group
-- ============================================================

CREATE OR REPLACE FUNCTION finalize_week(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_existing_winner RECORD;
  v_winner_user_id UUID;
  v_total_points INT;
  v_prompt_choices JSONB;
  v_est_time TIMESTAMPTZ;
  v_day_of_week INTEGER;
  v_hour INTEGER;
  v_total_prompts INT;
BEGIN
  -- Calculate the correct week (same logic as fireside)
  IF p_week_of IS NULL THEN
    v_est_time := now() AT TIME ZONE 'America/New_York';
    v_day_of_week := EXTRACT(DOW FROM v_est_time);
    v_hour := EXTRACT(HOUR FROM v_est_time);

    IF (v_day_of_week = 0 AND v_hour >= 21) OR (v_day_of_week = 1 AND v_hour < 3) THEN
      v_week := date_trunc('week', (v_est_time - interval '1 day')::date)::date;
    ELSE
      v_week := date_trunc('week', v_est_time::date)::date;
    END IF;
  ELSE
    v_week := p_week_of;
  END IF;

  -- Idempotency: if already finalized, return existing winner
  SELECT * INTO v_existing_winner
  FROM weekly_winners
  WHERE group_id = p_group_id AND week_of = v_week;

  IF v_existing_winner.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'winner_user_id', v_existing_winner.winner_user_id,
      'already_finalized', true
    );
  END IF;

  -- First, calculate quiplash winners
  PERFORM calculate_quiplash_winners(p_group_id, v_week);

  -- Find the user with most points
  SELECT user_id, (points_answering + points_voting + points_quiplash_wins)
  INTO v_winner_user_id, v_total_points
  FROM weekly_points
  WHERE group_id = p_group_id AND week_of = v_week
  ORDER BY
    (points_answering + points_voting + points_quiplash_wins) DESC,
    points_answering DESC,
    random()
  LIMIT 1;

  IF v_winner_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No participants this week');
  END IF;

  -- Generate 3 random prompt choices for the winner
  SELECT jsonb_agg(jsonb_build_object('id', id, 'type', type, 'content', content, 'title', title))
  INTO v_prompt_choices
  FROM (
    SELECT id, type, content, title
    FROM prompts
    WHERE is_active = true AND type != 'quiplash'
    ORDER BY random()
    LIMIT 3
  ) p;

  -- Insert weekly winner
  INSERT INTO weekly_winners (group_id, week_of, winner_user_id, prompt_choices)
  VALUES (p_group_id, v_week, v_winner_user_id, v_prompt_choices);

  -- NOTE: No longer setting profiles.weekly_crown_until
  -- Crown is now determined per-group from weekly_winners table

  -- Detect perfect weeks
  SELECT COUNT(*) INTO v_total_prompts
  FROM group_prompts
  WHERE group_id = p_group_id AND week_of = v_week;

  IF v_total_prompts > 0 THEN
    UPDATE weekly_points wp
    SET perfect_week = true
    WHERE wp.group_id = p_group_id
      AND wp.week_of = v_week
      AND (
        SELECT COUNT(DISTINCT r.group_prompt_id)
        FROM responses r
        JOIN group_prompts gp ON gp.id = r.group_prompt_id
        WHERE r.user_id = wp.user_id
          AND gp.group_id = p_group_id
          AND gp.week_of = v_week
      ) >= v_total_prompts;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'winner_user_id', v_winner_user_id,
    'total_points', v_total_points,
    'prompt_choices', v_prompt_choices
  );
END;
$$;
