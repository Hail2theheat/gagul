-- 106_security_harden_award_points.sql
-- Fix award_points RPC to:
-- 1. Use auth.uid() instead of accepting p_user_id from client (prevents awarding points to others)
-- 2. Derive point values server-side from event_type (prevents client sending arbitrary amounts)
-- 3. Add idempotency constraint to prevent double-awards for the same event

-- ============================================================
-- 1. Add unique constraint for idempotency
-- ============================================================
-- Prevents the same user from getting points twice for the same event+reference.
-- reference_id is nullable, so we use COALESCE to handle NULL values in the unique index.
-- First, deduplicate existing rows keeping the earliest entry per (user, event_type, reference).
DELETE FROM point_events
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, event_type, COALESCE(reference_id, '00000000-0000-0000-0000-000000000000'::uuid))
    id
  FROM point_events
  ORDER BY user_id, event_type, COALESCE(reference_id, '00000000-0000-0000-0000-000000000000'::uuid), created_at ASC
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_point_events_idempotent
  ON point_events (user_id, event_type, COALESCE(reference_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ============================================================
-- 2. Replace award_points with hardened version
-- ============================================================
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_event_type TEXT,
  p_points INTEGER,          -- kept for backward compat but IGNORED (derived server-side)
  p_group_id UUID DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_points INTEGER;
BEGIN
  -- SECURITY: When called from client RPC, auth.uid() is set -> use it (ignore p_user_id).
  -- When called from server-side triggers (quiplash win, like received), auth.uid() is NULL
  -- -> allow p_user_id from the trusted SECURITY DEFINER trigger context.
  v_user_id := COALESCE(auth.uid(), p_user_id);
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user context available';
  END IF;

  -- SECURITY: Derive points from event_type server-side, ignore client-supplied amount
  CASE p_event_type
    WHEN 'response'        THEN v_points := 3;
    WHEN 'photo_bonus'     THEN v_points := 1;
    WHEN 'first_responder' THEN v_points := 1;
    WHEN 'comment'         THEN v_points := 1;
    WHEN 'like_received'   THEN v_points := 1;
    WHEN 'rating'          THEN v_points := 1;
    WHEN 'quiplash_win'    THEN v_points := 5;
    WHEN 'fireside'        THEN v_points := 5;
    WHEN 'perfect_week'    THEN v_points := 10;
    WHEN 'streak_bonus'    THEN v_points := 1;
    ELSE
      RAISE EXCEPTION 'Invalid event_type: %', p_event_type;
  END CASE;

  -- Insert point event (unique index prevents duplicates)
  INSERT INTO point_events (user_id, group_id, event_type, points, reference_id)
  VALUES (v_user_id, p_group_id, p_event_type, v_points, p_reference_id)
  ON CONFLICT (user_id, event_type, COALESCE(reference_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO NOTHING;

  -- Check if insert actually happened (not a duplicate)
  IF NOT FOUND THEN
    -- Duplicate event, return 0 (already awarded)
    RETURN 0;
  END IF;

  -- Set bypass flag so the protect_profile_points trigger allows this update
  PERFORM set_config('app.bypass_points_protection', 'true', true);

  -- Update user's total points
  UPDATE profiles
  SET total_points = COALESCE(total_points, 0) + v_points,
      weekly_points = COALESCE(weekly_points, 0) + v_points
  WHERE id = v_user_id;

  -- Reset bypass flag
  PERFORM set_config('app.bypass_points_protection', '', true);

  RETURN v_points;
END;
$$;

-- ============================================================
-- 3. Also harden check_streak_bonus to use auth.uid()
-- ============================================================
CREATE OR REPLACE FUNCTION check_streak_bonus(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_streak INTEGER;
  v_last_bonus DATE;
  v_current_week DATE;
BEGIN
  -- SECURITY: Use auth.uid(), ignore client-supplied user_id
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_current_week := date_trunc('week', CURRENT_DATE)::DATE;

  SELECT current_streak, last_streak_bonus_week
  INTO v_streak, v_last_bonus
  FROM profiles WHERE id = v_user_id;

  -- If streak is 7+ and haven't got bonus this week
  IF v_streak >= 7 AND (v_last_bonus IS NULL OR v_last_bonus < v_current_week) THEN
    -- Award 1 bonus point (uses the hardened award_points which will use auth.uid())
    PERFORM award_points(v_user_id, 'streak_bonus', 1, NULL, NULL);

    -- Set bypass flag so trigger allows updating last_streak_bonus_week
    PERFORM set_config('app.bypass_points_protection', 'true', true);

    -- Mark bonus as claimed this week
    UPDATE profiles SET last_streak_bonus_week = v_current_week WHERE id = v_user_id;

    -- Reset bypass flag
    PERFORM set_config('app.bypass_points_protection', '', true);

    RETURN 1;
  END IF;

  RETURN 0;
END;
$$;

-- ============================================================
-- 4. Harden check_perfect_week to validate group membership
-- ============================================================
CREATE OR REPLACE FUNCTION check_perfect_week(p_user_id UUID, p_group_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_week_start DATE;
  v_prompts_count INTEGER;
  v_responses_count INTEGER;
BEGIN
  -- SECURITY: Use auth.uid()
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- SECURITY: Verify user is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;

  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;

  -- Count prompts this week for the group
  SELECT COUNT(*) INTO v_prompts_count
  FROM group_prompts
  WHERE group_id = p_group_id
    AND week_of = v_week_start;

  -- Count user's responses this week
  SELECT COUNT(*) INTO v_responses_count
  FROM responses r
  JOIN group_prompts gp ON gp.id = r.group_prompt_id
  WHERE r.user_id = v_user_id
    AND gp.group_id = p_group_id
    AND gp.week_of = v_week_start;

  -- If all prompts answered (and at least 7)
  IF v_prompts_count >= 7 AND v_responses_count >= v_prompts_count THEN
    -- Check if already awarded this week for this group
    IF NOT EXISTS (
      SELECT 1 FROM point_events
      WHERE user_id = v_user_id
        AND group_id = p_group_id
        AND event_type = 'perfect_week'
        AND created_at >= v_week_start
    ) THEN
      PERFORM award_points(v_user_id, 'perfect_week', 10, p_group_id, NULL);
      RETURN 10;
    END IF;
  END IF;

  RETURN 0;
END;
$$;

-- ============================================================
-- 5. Add expiry check to submit_quiplash_vote
-- ============================================================
CREATE OR REPLACE FUNCTION submit_quiplash_vote(p_matchup_id UUID, p_response_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_is_participant BOOLEAN;
  v_group_prompt_id UUID;
  v_is_expired BOOLEAN;
BEGIN
  -- SECURITY: Check the user is not voting on their own matchup
  SELECT EXISTS (
    SELECT 1 FROM quiplash_assignments
    WHERE matchup_id = p_matchup_id AND user_id = auth.uid()
  ) INTO v_is_participant;

  IF v_is_participant THEN
    RETURN jsonb_build_object('error', 'Cannot vote on your own matchup');
  END IF;

  -- SECURITY: Check the prompt hasn't expired
  SELECT gp.id,
         (gp.expires_at IS NOT NULL AND gp.expires_at < now()) AS is_expired
  INTO v_group_prompt_id, v_is_expired
  FROM quiplash_assignments qa
  JOIN group_prompts gp ON gp.id = qa.group_prompt_id
  WHERE qa.matchup_id = p_matchup_id
  LIMIT 1;

  IF v_is_expired THEN
    RETURN jsonb_build_object('error', 'Voting period has ended');
  END IF;

  -- SECURITY: Verify voter is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    JOIN group_prompts gp ON gp.group_id = gm.group_id
    WHERE gp.id = v_group_prompt_id
      AND gm.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('error', 'Not a member of this group');
  END IF;

  INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
  VALUES (p_matchup_id, auth.uid(), p_response_id)
  ON CONFLICT (matchup_id, voter_id) DO UPDATE SET voted_for_response_id = p_response_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
