-- 042: Add username and avatar_config to fireside responses
-- This fixes the display of user info during Fireside Lowdown

CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
  v_winner JSONB;
BEGIN
  -- Determine which week to use
  IF p_week_of IS NULL THEN
    v_week := date_trunc('week', now())::date;
  ELSE
    v_week := p_week_of;
  END IF;

  -- Get all prompts for the week with responses
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
            SELECT COUNT(*)
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
    WHERE gp.group_id = p_group_id AND gp.week_of = v_week
  ) prompt_data;

  -- Get leaderboard
  v_leaderboard := get_weekly_leaderboard(p_group_id, v_week);

  -- Get winner info
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
