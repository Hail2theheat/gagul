-- Fix get_fireside_data to include quiplash_data with correct week calculation

-- Create quiplash_matchups table if it doesn't exist (for tracking winners)
CREATE TABLE IF NOT EXISTS quiplash_matchups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  group_prompt_id UUID NOT NULL REFERENCES group_prompts(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  winner_response_id UUID REFERENCES responses(id),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matchup_id)
);

CREATE INDEX IF NOT EXISTS idx_quiplash_matchups_group_week ON quiplash_matchups(group_id, week_of);

-- Update get_fireside_data to include quiplash_data with correct week calculation
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

    -- During Fireside (Sunday 9PM - Monday 3AM EST), show the week that just ended
    IF (v_day_of_week = 0 AND v_hour >= 21) OR (v_day_of_week = 1 AND v_hour < 3) THEN
      v_week := date_trunc('week', (v_est_time - interval '1 day')::date)::date;
    ELSE
      v_week := date_trunc('week', v_est_time::date)::date;
    END IF;
  ELSE
    v_week := p_week_of;
  END IF;

  RAISE NOTICE 'Fireside using week_of: %', v_week;

  -- Get all prompts for the week with responses and quiplash data
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
        SELECT jsonb_agg(jsonb_build_object(
          'response_id', r.id,
          'user_id', r.user_id,
          'username', COALESCE(pr.username, 'Anonymous'),
          'avatar_config', pr.avatar_config,
          'content', r.content,
          'media_url', r.media_url,
          'selected_option', r.selected_option,
          'submitted_at', r.submitted_at
        ))
        FROM responses r
        LEFT JOIN profiles pr ON pr.id = r.user_id
        WHERE r.group_prompt_id = gp.id
      ) as responses,
      -- Include quiplash data with vote counts
      CASE WHEN p.type = 'quiplash' THEN (
        SELECT jsonb_agg(jsonb_build_object(
          'matchup_id', qa.matchup_id,
          'user_id', qa.user_id,
          'username', COALESCE(pr.username, 'Anonymous'),
          'avatar_config', pr.avatar_config,
          'response', (
            SELECT jsonb_build_object('id', r.id, 'content', r.content)
            FROM responses r
            WHERE r.group_prompt_id = gp.id AND r.user_id = qa.user_id
          ),
          'votes', (
            SELECT COUNT(*)::int
            FROM quiplash_votes qv
            JOIN responses r ON r.id = qv.voted_for_response_id
            WHERE qv.matchup_id = qa.matchup_id AND r.user_id = qa.user_id
          )
        ))
        FROM quiplash_assignments qa
        LEFT JOIN profiles pr ON pr.id = qa.user_id
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

  -- Get winner info (if exists)
  SELECT jsonb_build_object(
    'user_id', winner_user_id,
    'has_chosen', has_chosen,
    'chosen_prompt_id', chosen_prompt_id,
    'custom_prompt_content', custom_prompt_content,
    'prompt_choices', prompt_choices
  ) INTO v_winner
  FROM weekly_winners
  WHERE group_id = p_group_id AND week_of = v_week;

  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'winner', v_winner
  );
END;
$$;

-- Update leaderboard to calculate quiplash wins from votes instead of non-existent table
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
  -- 3 points per response, +1 for photo/video, +5 for quiplash wins
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
      -- Count quiplash wins by finding matchups where this user's response got the most votes
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
