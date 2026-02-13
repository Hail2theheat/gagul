-- MVP System: Fix get_fireside_data to return winner info, update finalize_week with idempotency,
-- update winner_choose_prompt to schedule the chosen prompt

-- 1. Fix get_fireside_data to query weekly_winners and return winner info
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

  -- Get winner info from weekly_winners (instead of hardcoded NULL)
  SELECT jsonb_build_object(
    'user_id', ww.winner_user_id,
    'username', pr.username,
    'avatar_config', pr.avatar_config,
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

-- 2. Update finalize_week with idempotency check and tie-breaking
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

  RETURN jsonb_build_object(
    'success', true,
    'winner_user_id', v_winner_user_id,
    'total_points', v_total_points,
    'prompt_choices', v_prompt_choices
  );
END;
$$;

-- 3. Update winner_choose_prompt to also schedule the prompt for next week
CREATE OR REPLACE FUNCTION winner_choose_prompt(
  p_group_id UUID,
  p_week_of DATE,
  p_chosen_prompt_id UUID DEFAULT NULL,
  p_custom_content TEXT DEFAULT NULL,
  p_custom_type TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_winner RECORD;
  v_prompt_id UUID;
  v_next_week DATE;
  v_random_day INTEGER;
  v_random_hour INTEGER;
  v_scheduled_for TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Verify caller is the winner
  SELECT * INTO v_winner
  FROM weekly_winners
  WHERE group_id = p_group_id AND week_of = p_week_of AND winner_user_id = auth.uid();

  IF v_winner.id IS NULL THEN
    RETURN jsonb_build_object('error', 'You are not the winner for this week');
  END IF;

  IF v_winner.has_chosen THEN
    RETURN jsonb_build_object('error', 'Already chose a prompt');
  END IF;

  -- Determine the prompt to schedule
  IF p_chosen_prompt_id IS NOT NULL THEN
    v_prompt_id := p_chosen_prompt_id;
  ELSIF p_custom_content IS NOT NULL THEN
    -- Create a new custom prompt
    INSERT INTO prompts (content, title, type, is_active, category, created_by)
    VALUES (
      p_custom_content,
      p_custom_content,
      COALESCE(p_custom_type, 'short_text'),
      true,
      'mvp_pick',
      auth.uid()
    )
    RETURNING id INTO v_prompt_id;
  ELSE
    RETURN jsonb_build_object('error', 'Must provide either a prompt ID or custom content');
  END IF;

  -- Update the winner record
  UPDATE weekly_winners
  SET
    chosen_prompt_id = v_prompt_id,
    custom_prompt_content = p_custom_content,
    custom_prompt_type = p_custom_type,
    has_chosen = true
  WHERE id = v_winner.id;

  -- Schedule the prompt for next week
  -- Pick a random weekday (1=Mon through 5=Fri)
  v_next_week := p_week_of + interval '7 days';
  v_random_day := 1 + floor(random() * 5)::integer; -- 1-5 (Mon-Fri)
  -- Random hour between 9AM and 6PM EST (14:00-23:00 UTC)
  v_random_hour := 9 + floor(random() * 10)::integer; -- 9-18 EST

  -- Build scheduled_for timestamp in EST then convert to UTC
  v_scheduled_for := ((v_next_week + (v_random_day || ' days')::interval)::date
    || ' ' || v_random_hour || ':00:00')::timestamp AT TIME ZONE 'America/New_York';

  -- Expires at midnight EST of that day
  v_expires_at := ((v_next_week + (v_random_day || ' days')::interval)::date
    || ' 23:59:59')::timestamp AT TIME ZONE 'America/New_York';

  -- Insert into group_prompts for the next week
  INSERT INTO group_prompts (group_id, prompt_id, week_of, scheduled_for, expires_at)
  VALUES (p_group_id, v_prompt_id, v_next_week, v_scheduled_for, v_expires_at)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'scheduled_for', v_scheduled_for);
END;
$$;
