-- Fix get_fireside_data: weekly_points has no total_points column, compute it
CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
  v_winner JSONB;
  v_meme_data JSONB;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', NOW())::DATE);

  -- Get prompts with responses (exclude meme_upload and meme_caption from regular list)
  SELECT jsonb_agg(prompt_data ORDER BY scheduled_for) INTO v_prompts
  FROM (
    SELECT gp.scheduled_for, jsonb_build_object(
      'group_prompt_id', gp.id,
      'scheduled_for', gp.scheduled_for,
      'prompt_id', p.id,
      'type', p.type,
      'content', p.content,
      'title', p.title,
      'options', p.options,
      'correct_answer', p.correct_answer,
      'is_most_likely', p.is_most_likely,
      'media_url', p.media_url,
      'responses', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'response_id', r.id,
          'user_id', r.user_id,
          'username', pr.username,
          'avatar_config', pr.avatar_config,
          'content', r.content,
          'media_url', r.media_url,
          'selected_option', r.selected_option,
          'submitted_at', r.submitted_at
        ) ORDER BY r.submitted_at)
        FROM responses r
        LEFT JOIN profiles pr ON pr.id = r.user_id
        WHERE r.group_prompt_id = gp.id
      ), '[]'::jsonb),
      'quiplash_data', CASE WHEN p.type = 'quiplash' THEN (
        SELECT jsonb_agg(jsonb_build_object(
          'matchup_id', qa.matchup_id,
          'user_id', qa.user_id,
          'username', pr.username,
          'avatar_config', pr.avatar_config,
          'response', (
            SELECT jsonb_build_object('id', r.id, 'content', r.content)
            FROM responses r WHERE r.group_prompt_id = gp.id AND r.user_id = qa.user_id
            LIMIT 1
          ),
          'votes', COALESCE((
            SELECT COUNT(*) FROM quiplash_votes qv
            JOIN responses r ON r.id = qv.voted_for_response_id
            WHERE qv.matchup_id = qa.matchup_id AND r.user_id = qa.user_id
          ), 0)
        ))
        FROM quiplash_assignments qa
        LEFT JOIN profiles pr ON pr.id = qa.user_id
        WHERE qa.group_prompt_id = gp.id
      ) ELSE NULL END,
      'mc_results', CASE WHEN p.type IN ('multiple_choice', 'quiz') THEN (
        SELECT get_multiple_choice_results(gp.id)
      ) ELSE NULL END
    ) as prompt_data
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND gp.week_of = v_week
      AND p.type NOT IN ('meme_upload', 'meme_caption')
    ORDER BY gp.scheduled_for
  ) sub;

  -- Get meme game data for this week
  v_meme_data := get_meme_results(p_group_id, v_week);

  -- Get leaderboard (compute total_points since column doesn't exist)
  v_leaderboard := (SELECT jsonb_agg(lb) FROM (
    SELECT jsonb_build_object(
      'user_id', wp.user_id,
      'username', pr.username,
      'avatar_config', pr.avatar_config,
      'points_answering', wp.points_answering,
      'points_voting', wp.points_voting,
      'points_quiplash_wins', wp.points_quiplash_wins,
      'total_points', (wp.points_answering + wp.points_voting + wp.points_quiplash_wins)
    ) as lb
    FROM weekly_points wp
    LEFT JOIN profiles pr ON pr.id = wp.user_id
    WHERE wp.group_id = p_group_id AND wp.week_of = v_week
    ORDER BY (wp.points_answering + wp.points_voting + wp.points_quiplash_wins) DESC
  ) sub2);

  -- Get winner
  v_winner := (
    SELECT jsonb_build_object(
      'user_id', ww.winner_user_id,
      'username', pr.username,
      'avatar_config', pr.avatar_config,
      'has_chosen', ww.has_chosen,
      'chosen_prompt_id', ww.chosen_prompt_id,
      'custom_prompt_content', ww.custom_prompt_content
    )
    FROM weekly_winners ww
    LEFT JOIN profiles pr ON pr.id = ww.winner_user_id
    WHERE ww.group_id = p_group_id AND ww.week_of = v_week
    LIMIT 1
  );

  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'winner', v_winner,
    'meme_data', v_meme_data
  );
END;
$$;
