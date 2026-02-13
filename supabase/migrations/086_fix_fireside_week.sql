-- Fix get_fireside_data to look at the correct week during Fireside hours
-- During Sunday night / Monday early morning, we want LAST week's data

CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
BEGIN
  -- Calculate the correct week
  -- If no week specified, figure out which week to show
  IF p_week_of IS NULL THEN
    -- Get current time in EST
    -- During Fireside (Sunday 9PM - Monday 3AM EST), show the week that just ended
    DECLARE
      v_est_time TIMESTAMPTZ;
      v_day_of_week INTEGER;
      v_hour INTEGER;
    BEGIN
      v_est_time := now() AT TIME ZONE 'America/New_York';
      v_day_of_week := EXTRACT(DOW FROM v_est_time); -- 0=Sunday, 1=Monday
      v_hour := EXTRACT(HOUR FROM v_est_time);

      -- If Sunday after 9PM or Monday before 3AM, use PREVIOUS week
      IF (v_day_of_week = 0 AND v_hour >= 21) OR (v_day_of_week = 1 AND v_hour < 3) THEN
        -- Use the week that started last Monday
        v_week := date_trunc('week', (v_est_time - interval '1 day')::date)::date;
      ELSE
        v_week := date_trunc('week', v_est_time::date)::date;
      END IF;
    END;
  ELSE
    v_week := p_week_of;
  END IF;

  RAISE NOTICE 'Fireside using week_of: %', v_week;

  -- Get prompts with responses for this week
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

  -- Return the data
  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', '[]'::jsonb,
    'winner', NULL
  );
END;
$$;
