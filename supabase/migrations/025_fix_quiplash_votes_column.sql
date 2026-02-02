-- =====================================================
-- FIX: quiplash_votes.voted_for_user_id doesn't exist
-- The column is voted_for_response_id, need to join through responses
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
  v_winner RECORD;
  v_result JSONB;
BEGIN
  -- Determine which week
  v_week := COALESCE(p_week_of, date_trunc('week', CURRENT_DATE)::DATE);

  -- Get all prompts for this week with their responses
  SELECT jsonb_agg(prompt_data ORDER BY scheduled_for) INTO v_prompts
  FROM (
    SELECT jsonb_build_object(
      'group_prompt_id', gp.id,
      'scheduled_for', gp.scheduled_for,
      'prompt_id', p.id,
      'type', p.type,
      'content', COALESCE(p.content, p.title),
      'title', p.title,
      'options', p.options,
      'correct_answer', p.correct_answer,
      'is_most_likely', COALESCE(p.is_most_likely, false),
      'responses', (
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
        JOIN profiles pr ON pr.id = r.user_id
        WHERE r.group_prompt_id = gp.id
      ),
      -- Include MC results for multiple_choice and quiz types
      'mc_results', CASE
        WHEN p.type IN ('multiple_choice', 'quiz') THEN get_multiple_choice_results(gp.id)
        ELSE NULL
      END,
      -- Include quiplash data if applicable
      'quiplash_data', CASE
        WHEN p.type = 'quiplash' THEN (
          SELECT jsonb_agg(
            jsonb_build_object(
              'matchup_id', qa.matchup_id,
              'user_id', qa.user_id,
              'username', pr.username,
              'avatar_config', pr.avatar_config,
              'response', (
                SELECT jsonb_build_object('id', r.id, 'content', r.content)
                FROM responses r
                WHERE r.group_prompt_id = qa.group_prompt_id
                  AND r.user_id = qa.user_id
                LIMIT 1
              ),
              'votes', (
                -- Count votes by joining through responses to match user
                SELECT COUNT(*)
                FROM quiplash_votes qv
                JOIN responses r ON r.id = qv.voted_for_response_id
                WHERE qv.matchup_id = qa.matchup_id
                  AND r.user_id = qa.user_id
              )
            )
          )
          FROM quiplash_assignments qa
          JOIN profiles pr ON pr.id = qa.user_id
          WHERE qa.group_prompt_id = gp.id
        )
        ELSE NULL
      END
    ) as prompt_data,
    gp.scheduled_for
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id AND gp.week_of = v_week
  ) sub;

  -- Get leaderboard
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', wp.user_id,
      'username', pr.username,
      'avatar_config', pr.avatar_config,
      'points_answering', wp.points_answering,
      'points_voting', wp.points_voting,
      'points_quiplash_wins', wp.points_quiplash_wins,
      'total_points', wp.points_answering + wp.points_voting + wp.points_quiplash_wins
    ) ORDER BY (wp.points_answering + wp.points_voting + wp.points_quiplash_wins) DESC
  ) INTO v_leaderboard
  FROM weekly_points wp
  JOIN profiles pr ON pr.id = wp.user_id
  WHERE wp.group_id = p_group_id AND wp.week_of = v_week;

  -- Get winner info
  SELECT ww.*, pr.username, pr.avatar_config INTO v_winner
  FROM weekly_winners ww
  JOIN profiles pr ON pr.id = ww.user_id
  WHERE ww.group_id = p_group_id AND ww.week_of = v_week;

  v_result := jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::JSONB),
    'leaderboard', COALESCE(v_leaderboard, '[]'::JSONB),
    'winner', CASE WHEN v_winner.user_id IS NOT NULL THEN jsonb_build_object(
      'user_id', v_winner.user_id,
      'username', v_winner.username,
      'avatar_config', v_winner.avatar_config,
      'has_chosen', v_winner.has_chosen,
      'chosen_prompt_id', v_winner.chosen_prompt_id,
      'custom_prompt_content', v_winner.custom_prompt_content
    ) ELSE NULL END
  );

  RETURN v_result;
END;
$$;
