-- Fix: restore quiplash_data in get_fireside_data (lost when migration 102 rewrote the function)
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
      -- Quiplash data: matchups with participants, responses, and vote counts
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

  -- Get leaderboard
  v_leaderboard := get_weekly_leaderboard(p_group_id, v_week);

  -- Get winner info from weekly_winners
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
