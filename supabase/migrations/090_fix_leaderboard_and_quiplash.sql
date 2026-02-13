-- Fix leaderboard to use correct week and calculate from actual data

-- First, check if weekly_points table exists and has data
DO $$
BEGIN
  RAISE NOTICE 'Checking weekly_points...';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weekly_points') THEN
    RAISE NOTICE 'weekly_points table exists';
  ELSE
    RAISE NOTICE 'weekly_points table DOES NOT exist - need to calculate from responses';
  END IF;
END $$;

-- Create/update the leaderboard function to calculate points from responses directly
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
  -- 3 points per response, +1 for photo/video
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', user_data.user_id,
      'username', user_data.username,
      'avatar_config', user_data.avatar_config,
      'points_answering', user_data.response_points,
      'points_voting', 0,
      'points_quiplash_wins', COALESCE(user_data.quiplash_wins, 0) * 5,
      'total_points', user_data.response_points + COALESCE(user_data.quiplash_wins, 0) * 5
    ) ORDER BY (user_data.response_points + COALESCE(user_data.quiplash_wins, 0) * 5) DESC
  ) INTO v_result
  FROM (
    SELECT
      gm.user_id,
      p.username,
      p.avatar_config,
      COALESCE(SUM(
        CASE
          WHEN r.id IS NOT NULL THEN
            3 + CASE WHEN r.media_url IS NOT NULL THEN 1 ELSE 0 END
          ELSE 0
        END
      ), 0)::int as response_points,
      (
        SELECT COUNT(*)::int
        FROM quiplash_matchups qm
        JOIN responses qr ON qr.id = qm.winner_response_id
        WHERE qr.user_id = gm.user_id
          AND qm.group_id = p_group_id
          AND qm.week_of = v_week
      ) as quiplash_wins
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    LEFT JOIN responses r ON r.user_id = gm.user_id
    LEFT JOIN group_prompts gp ON gp.id = r.group_prompt_id
      AND gp.group_id = p_group_id
      AND gp.week_of = v_week
    WHERE gm.group_id = p_group_id
    GROUP BY gm.user_id, p.username, p.avatar_config
  ) user_data
  WHERE user_data.response_points > 0 OR user_data.quiplash_wins > 0;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Update get_fireside_data to include the leaderboard
CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
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

  -- Get prompts with responses
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
            'content', r.content,
            'media_url', r.media_url,
            'selected_option', r.selected_option,
            'submitted_at', r.submitted_at
          )
        )
        FROM responses r
        LEFT JOIN profiles pr ON pr.id = r.user_id
        WHERE r.group_prompt_id = gp.id
      ) as responses
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND gp.week_of = v_week
    ORDER BY gp.scheduled_for
  ) prompt_data;

  -- Get leaderboard
  v_leaderboard := get_weekly_leaderboard(p_group_id, v_week);

  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'winner', NULL
  );
END;
$$;
