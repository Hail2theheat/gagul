-- 133: Reward System — weekly crown, fire levels, perfect week badge, seasonal unlocks

-- 1. Weekly crown: winner gets a glowing crown on their avatar for 7 days
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_crown_until timestamptz;

-- 2. Group fire level: campfire grows with group streak (1-5)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS fire_level integer DEFAULT 1;

-- 3. Perfect week badge: true when user answered every prompt that week
ALTER TABLE weekly_points ADD COLUMN IF NOT EXISTS perfect_week boolean DEFAULT false;

-- 4. Seasonal unlocks: array of seasonal item IDs the user has earned
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_seasonal text[] DEFAULT '{}';

-- ============================================================
-- Update finalize_week: set weekly crown + detect perfect weeks
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

  -- Find the user with most points, with tie-breaking:
  -- 1. Most total points
  -- 2. Most answering points (tie-break)
  -- 3. Random (final tie-break)
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

  -- === NEW: Set weekly crown on winner's profile ===
  UPDATE profiles
  SET weekly_crown_until = now() + interval '7 days'
  WHERE id = v_winner_user_id;

  -- === NEW: Detect perfect weeks ===
  -- Count total prompts for this group this week
  SELECT COUNT(*) INTO v_total_prompts
  FROM group_prompts
  WHERE group_id = p_group_id AND week_of = v_week;

  -- For each user, check if they answered all prompts
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

-- ============================================================
-- Update get_weekly_leaderboard: return perfect_week + weekly_crown_until
-- ============================================================
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_result JSONB;
  v_est_time TIMESTAMPTZ;
  v_day_of_week INTEGER;
  v_hour INTEGER;
BEGIN
  -- Calculate correct week (same logic as fireside)
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

  RAISE NOTICE 'Leaderboard using week: %', v_week;

  -- Calculate points from responses
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', user_data.user_id,
      'username', user_data.username,
      'avatar_config', user_data.avatar_config,
      'weekly_crown_until', user_data.weekly_crown_until,
      'points_answering', user_data.response_points,
      'points_voting', 0,
      'points_quiplash_wins', COALESCE(user_data.quiplash_wins, 0) * 5,
      'total_points', user_data.response_points + COALESCE(user_data.quiplash_wins, 0) * 5,
      'perfect_week', COALESCE(user_data.perfect_week, false)
    ) ORDER BY (user_data.response_points + COALESCE(user_data.quiplash_wins, 0) * 5) DESC
  ) INTO v_result
  FROM (
    SELECT
      gm.user_id,
      p.username,
      p.avatar_config,
      p.weekly_crown_until,
      COALESCE(SUM(
        CASE
          WHEN r.id IS NOT NULL THEN
            3 + CASE WHEN r.media_url IS NOT NULL THEN 1 ELSE 0 END
          ELSE 0
        END
      ), 0)::int as response_points,
      (
        SELECT COUNT(*)::int
        FROM (
          SELECT qa.matchup_id
          FROM quiplash_assignments qa
          JOIN group_prompts gp2 ON gp2.id = qa.group_prompt_id
          JOIN responses r2 ON r2.group_prompt_id = qa.group_prompt_id AND r2.user_id = qa.user_id
          WHERE qa.user_id = gm.user_id
            AND gp2.group_id = p_group_id
            AND gp2.week_of = v_week
            AND (
              SELECT COUNT(*)
              FROM quiplash_votes qv
              WHERE qv.matchup_id = qa.matchup_id AND qv.voted_for_response_id = r2.id
            ) > (
              SELECT COALESCE(MAX(other_votes), 0)
              FROM (
                SELECT COUNT(*) as other_votes
                FROM quiplash_votes qv2
                JOIN responses r3 ON r3.id = qv2.voted_for_response_id
                WHERE qv2.matchup_id = qa.matchup_id AND r3.user_id != gm.user_id
              ) sq
            )
            AND (
              SELECT COUNT(*)
              FROM quiplash_votes qv
              WHERE qv.matchup_id = qa.matchup_id AND qv.voted_for_response_id = r2.id
            ) > 0
        ) wins
      ) as quiplash_wins,
      -- Get perfect_week from weekly_points if it exists
      (
        SELECT wp.perfect_week
        FROM weekly_points wp
        WHERE wp.user_id = gm.user_id
          AND wp.group_id = p_group_id
          AND wp.week_of = v_week
        LIMIT 1
      ) as perfect_week
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    LEFT JOIN responses r ON r.user_id = gm.user_id
    LEFT JOIN group_prompts gp ON gp.id = r.group_prompt_id
      AND gp.group_id = p_group_id
      AND gp.week_of = v_week
    WHERE gm.group_id = p_group_id
    GROUP BY gm.user_id, p.username, p.avatar_config, p.weekly_crown_until
  ) user_data
  WHERE user_data.response_points > 0 OR user_data.quiplash_wins > 0;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ============================================================
-- Update get_fireside_data: include weekly_crown_until in winner + leaderboard
-- ============================================================
CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
  v_winner JSONB;
  v_est_time TIMESTAMPTZ;
  v_day_of_week INTEGER;
  v_hour INTEGER;
BEGIN
  -- Calculate the correct week
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

  -- Get prompts with responses AND quiplash_data
  SELECT jsonb_agg(prompt_data ORDER BY scheduled_for)
  INTO v_prompts
  FROM (
    SELECT
      gp.id as group_prompt_id,
      gp.scheduled_for,
      p.id as prompt_id,
      p.type,
      p.content,
      p.title,
      p.options,
      p.correct_answer,
      p.is_most_likely,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'response_id', r.id,
            'user_id', r.user_id,
            'username', pr.username,
            'avatar_config', pr.avatar_config,
            'weekly_crown_until', pr.weekly_crown_until,
            'content', r.content,
            'media_url', r.media_url,
            'selected_option', r.selected_option,
            'submitted_at', r.submitted_at
          )
        )
        FROM responses r
        LEFT JOIN profiles pr ON pr.id = r.user_id
        WHERE r.group_prompt_id = gp.id
      ) as responses,
      -- Quiplash data
      CASE WHEN p.type = 'quiplash' THEN (
        SELECT jsonb_agg(jsonb_build_object(
          'matchup_id', qa.matchup_id,
          'user_id', qa.user_id,
          'username', COALESCE(pr2.username, 'Anonymous'),
          'avatar_config', pr2.avatar_config,
          'response', (
            SELECT jsonb_build_object('id', r2.id, 'content', r2.content)
            FROM responses r2
            WHERE r2.group_prompt_id = gp.id AND r2.user_id = qa.user_id
            LIMIT 1
          ),
          'votes', (
            SELECT COUNT(*)
            FROM quiplash_votes qv
            JOIN responses r3 ON r3.id = qv.voted_for_response_id
            WHERE qv.matchup_id = qa.matchup_id
              AND r3.user_id = qa.user_id
          )
        ))
        FROM quiplash_assignments qa
        LEFT JOIN profiles pr2 ON pr2.id = qa.user_id
        WHERE qa.group_prompt_id = gp.id
      ) END as quiplash_data
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND gp.week_of = v_week
    ORDER BY gp.scheduled_for
  ) prompt_data;

  -- Get leaderboard (now includes perfect_week + weekly_crown_until)
  v_leaderboard := get_weekly_leaderboard(p_group_id, v_week);

  -- Get winner info from weekly_winners
  SELECT jsonb_build_object(
    'user_id', ww.winner_user_id,
    'username', pr.username,
    'avatar_config', pr.avatar_config,
    'weekly_crown_until', pr.weekly_crown_until,
    'has_chosen', ww.has_chosen,
    'chosen_prompt_id', ww.chosen_prompt_id,
    'custom_prompt_content', ww.custom_prompt_content,
    'prompt_choices', ww.prompt_choices
  ) INTO v_winner
  FROM weekly_winners ww
  LEFT JOIN profiles pr ON pr.id = ww.winner_user_id
  WHERE ww.group_id = p_group_id AND ww.week_of = v_week;

  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'winner', v_winner
  );
END;
$$;

-- ============================================================
-- Update update_group_streaks: compute fire_level from streak
-- ============================================================
CREATE OR REPLACE FUNCTION update_group_streaks()
RETURNS TABLE(group_id UUID, new_streak INTEGER, streak_broken BOOLEAN) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group RECORD;
  v_check RECORD;
  v_current_group RECORD;
  v_new_streak INT;
BEGIN
  -- Find prompts that expired recently (last 2 hours)
  FOR v_group IN
    SELECT DISTINCT gp.group_id, gp.id AS group_prompt_id, gp.expires_at::date AS prompt_date
    FROM group_prompts gp
    WHERE gp.expires_at BETWEEN now() - interval '2 hours' AND now()
      AND gp.is_active = true
  LOOP
    -- Guard: skip if we already processed this day for this group
    SELECT * INTO v_current_group FROM groups g WHERE g.id = v_group.group_id;
    IF v_current_group.last_streak_date IS NOT NULL
       AND v_current_group.last_streak_date >= v_group.prompt_date THEN
      CONTINUE;
    END IF;

    -- Check participation for this prompt (includes fireside)
    SELECT * INTO v_check FROM check_group_prompt_participation(v_group.group_prompt_id);

    IF v_check.met_threshold THEN
      -- Met 50%+ threshold — increment streak
      v_new_streak := CASE
        WHEN v_current_group.last_streak_date = v_group.prompt_date - interval '1 day'
             OR v_current_group.last_streak_date IS NULL
        THEN v_current_group.current_streak + 1
        ELSE 1
      END;

      UPDATE groups g
      SET
        current_streak = v_new_streak,
        longest_streak = GREATEST(v_current_group.longest_streak, v_new_streak),
        last_streak_date = v_group.prompt_date,
        -- Compute fire_level from streak: level 1-5
        fire_level = LEAST(GREATEST(1, CEIL(v_new_streak::float / 3)::int), 5)
      WHERE g.id = v_group.group_id;

      SELECT v_group.group_id, g.current_streak, false
      INTO group_id, new_streak, streak_broken
      FROM groups g WHERE g.id = v_group.group_id;
      RETURN NEXT;
    ELSE
      -- Didn't meet threshold — break streak, fire drops to level 1
      UPDATE groups g
      SET current_streak = 0,
          last_streak_date = v_group.prompt_date,
          fire_level = 1
      WHERE g.id = v_group.group_id;

      SELECT v_group.group_id, 0, true
      INTO group_id, new_streak, streak_broken;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- New RPC: get_seasonal_progress — counts responses in current season
-- ============================================================
CREATE OR REPLACE FUNCTION get_seasonal_progress(p_user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user UUID;
  v_now DATE;
  v_month INT;
  v_season TEXT;
  v_season_start DATE;
  v_season_end DATE;
  v_response_count INT;
BEGIN
  v_user := COALESCE(p_user_id, auth.uid());
  v_now := (now() AT TIME ZONE 'America/New_York')::date;
  v_month := EXTRACT(MONTH FROM v_now);

  -- Determine season
  IF v_month IN (12, 1, 2) THEN
    v_season := 'winter';
    v_season_start := CASE WHEN v_month = 12
      THEN make_date(EXTRACT(YEAR FROM v_now)::int, 12, 1)
      ELSE make_date(EXTRACT(YEAR FROM v_now)::int - 1, 12, 1)
    END;
    v_season_end := make_date(EXTRACT(YEAR FROM v_season_start)::int + 1, 2, 28);
  ELSIF v_month IN (3, 4, 5) THEN
    v_season := 'spring';
    v_season_start := make_date(EXTRACT(YEAR FROM v_now)::int, 3, 1);
    v_season_end := make_date(EXTRACT(YEAR FROM v_now)::int, 5, 31);
  ELSIF v_month IN (6, 7, 8) THEN
    v_season := 'summer';
    v_season_start := make_date(EXTRACT(YEAR FROM v_now)::int, 6, 1);
    v_season_end := make_date(EXTRACT(YEAR FROM v_now)::int, 8, 31);
  ELSE
    v_season := 'fall';
    v_season_start := make_date(EXTRACT(YEAR FROM v_now)::int, 9, 1);
    v_season_end := make_date(EXTRACT(YEAR FROM v_now)::int, 11, 30);
  END IF;

  -- Count responses during this season
  SELECT COUNT(*) INTO v_response_count
  FROM responses r
  WHERE r.user_id = v_user
    AND r.submitted_at >= v_season_start
    AND r.submitted_at < v_season_end + interval '1 day';

  RETURN jsonb_build_object(
    'season', v_season,
    'season_start', v_season_start,
    'season_end', v_season_end,
    'response_count', v_response_count,
    'days_remaining', (v_season_end - v_now)
  );
END;
$$;

-- Initialize fire_level for existing groups based on current streak
UPDATE groups SET fire_level = LEAST(GREATEST(1, CEIL(current_streak::float / 3)::int), 5)
WHERE current_streak > 0;
