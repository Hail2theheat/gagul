-- =====================================================
-- MULTIPLE CHOICE RESULTS & MAJORITY GUESSING
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Function to get aggregated results for multiple choice prompts
CREATE OR REPLACE FUNCTION get_multiple_choice_results(p_group_prompt_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prompt RECORD;
  v_results JSONB;
  v_total INTEGER;
  v_majority_option TEXT;
  v_majority_count INTEGER;
BEGIN
  -- Get the prompt info
  SELECT gp.*, p.type, p.is_most_likely, p.options, p.correct_answer
  INTO v_prompt
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.id = p_group_prompt_id;

  IF v_prompt.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Group prompt not found');
  END IF;

  -- Only works for multiple_choice and quiz types
  IF v_prompt.type NOT IN ('multiple_choice', 'quiz') THEN
    RETURN jsonb_build_object('error', 'Not a multiple choice prompt');
  END IF;

  -- Get total response count
  SELECT COUNT(*) INTO v_total
  FROM responses
  WHERE group_prompt_id = p_group_prompt_id AND selected_option IS NOT NULL;

  -- If it's a "Most Likely To" prompt, aggregate by user_id (selected_option contains user_id)
  IF v_prompt.is_most_likely THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'option', r.selected_option,
        'count', r.vote_count,
        'percentage', CASE WHEN v_total > 0 THEN ROUND((r.vote_count::NUMERIC / v_total) * 100) ELSE 0 END,
        'user_id', r.selected_option,
        'username', p.username,
        'avatar_config', p.avatar_config
      ) ORDER BY r.vote_count DESC
    ) INTO v_results
    FROM (
      SELECT selected_option, COUNT(*) as vote_count
      FROM responses
      WHERE group_prompt_id = p_group_prompt_id AND selected_option IS NOT NULL
      GROUP BY selected_option
    ) r
    LEFT JOIN profiles p ON p.id::TEXT = r.selected_option;

    -- Get majority winner
    SELECT selected_option, COUNT(*) as cnt INTO v_majority_option, v_majority_count
    FROM responses
    WHERE group_prompt_id = p_group_prompt_id AND selected_option IS NOT NULL
    GROUP BY selected_option
    ORDER BY cnt DESC
    LIMIT 1;

  ELSE
    -- Regular multiple choice - aggregate by option text
    SELECT jsonb_agg(
      jsonb_build_object(
        'option', r.selected_option,
        'count', r.vote_count,
        'percentage', CASE WHEN v_total > 0 THEN ROUND((r.vote_count::NUMERIC / v_total) * 100) ELSE 0 END,
        'is_correct', v_prompt.correct_answer IS NOT NULL AND r.selected_option = v_prompt.correct_answer
      ) ORDER BY r.vote_count DESC
    ) INTO v_results
    FROM (
      SELECT selected_option, COUNT(*) as vote_count
      FROM responses
      WHERE group_prompt_id = p_group_prompt_id AND selected_option IS NOT NULL
      GROUP BY selected_option
    ) r;

    -- Get majority option
    SELECT selected_option, COUNT(*) as cnt INTO v_majority_option, v_majority_count
    FROM responses
    WHERE group_prompt_id = p_group_prompt_id AND selected_option IS NOT NULL
    GROUP BY selected_option
    ORDER BY cnt DESC
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'group_prompt_id', p_group_prompt_id,
    'prompt_type', v_prompt.type,
    'is_most_likely', COALESCE(v_prompt.is_most_likely, false),
    'total_responses', v_total,
    'results', COALESCE(v_results, '[]'::JSONB),
    'majority_option', v_majority_option,
    'majority_count', v_majority_count,
    'correct_answer', v_prompt.correct_answer
  );
END;
$$;

-- 2. Function to get who voted for what (individual responses)
CREATE OR REPLACE FUNCTION get_multiple_choice_voters(p_group_prompt_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', r.user_id,
        'username', p.username,
        'avatar_config', p.avatar_config,
        'selected_option', r.selected_option,
        'submitted_at', r.submitted_at
      ) ORDER BY r.submitted_at
    )
    FROM responses r
    JOIN profiles p ON p.id = r.user_id
    WHERE r.group_prompt_id = p_group_prompt_id AND r.selected_option IS NOT NULL
  );
END;
$$;

-- 3. Add "guess_majority" prompt type support
-- This is a variation where users guess what the majority will answer
-- The response stores their guess, and they get points if correct

-- Add flag to prompts table
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS is_majority_guess BOOLEAN DEFAULT false;

-- Add guess tracking column to responses
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS guessed_majority TEXT;

-- 4. Function to calculate who guessed the majority correctly
CREATE OR REPLACE FUNCTION get_majority_guessing_results(p_group_prompt_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_majority_option TEXT;
  v_results JSONB;
BEGIN
  -- Get the majority answer
  SELECT selected_option INTO v_majority_option
  FROM responses
  WHERE group_prompt_id = p_group_prompt_id AND selected_option IS NOT NULL
  GROUP BY selected_option
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Get all guesses and mark who was correct
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', r.user_id,
      'username', p.username,
      'avatar_config', p.avatar_config,
      'guessed', r.guessed_majority,
      'actual_majority', v_majority_option,
      'was_correct', r.guessed_majority = v_majority_option
    )
  ) INTO v_results
  FROM responses r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.group_prompt_id = p_group_prompt_id AND r.guessed_majority IS NOT NULL;

  RETURN jsonb_build_object(
    'group_prompt_id', p_group_prompt_id,
    'majority_answer', v_majority_option,
    'guesses', COALESCE(v_results, '[]'::JSONB),
    'correct_guessers', (
      SELECT COUNT(*) FROM responses
      WHERE group_prompt_id = p_group_prompt_id
        AND guessed_majority = v_majority_option
    )
  );
END;
$$;

-- 5. Update get_group_status to include is_majority_guess flag
CREATE OR REPLACE FUNCTION get_group_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_active RECORD;
  v_response RECORD;
  v_rating RECORD;
  v_members JSONB;
BEGIN
  -- Get active prompt for this group
  SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer,
         p.category, p.payload, p.is_most_likely, p.is_majority_guess
  INTO v_active
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id
    AND gp.scheduled_for <= now()
    AND gp.expires_at > now()
    AND gp.is_active = true
  ORDER BY gp.scheduled_for DESC
  LIMIT 1;

  -- Check if user has responded
  IF v_active.id IS NOT NULL THEN
    SELECT * INTO v_response FROM responses
    WHERE group_prompt_id = v_active.id AND user_id = auth.uid();

    SELECT * INTO v_rating FROM prompt_ratings
    WHERE prompt_id = v_active.pid AND user_id = auth.uid();

    -- Get members if this is a "most likely" prompt
    IF v_active.is_most_likely THEN
      v_members := get_group_members_with_avatars(p_group_id);
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'active_prompt_instance', CASE WHEN v_active.id IS NOT NULL AND v_response.id IS NULL THEN jsonb_build_object(
      'id', v_active.id,
      'prompt_id', v_active.pid,
      'scheduled_for', v_active.scheduled_for,
      'expires_at', v_active.expires_at,
      'week_of', v_active.week_of,
      'prompts', jsonb_build_object(
        'id', v_active.pid,
        'type', v_active.type,
        'content', v_active.content,
        'title', v_active.title,
        'options', v_active.options,
        'correct_answer', v_active.correct_answer,
        'category', v_active.category,
        'payload', v_active.payload,
        'is_most_likely', v_active.is_most_likely,
        'is_majority_guess', v_active.is_majority_guess
      ),
      'group_members', v_members
    ) ELSE NULL END,
    'active_expires_at', v_active.expires_at,
    'has_responded', v_response.id IS NOT NULL,
    'has_rated', v_rating.id IS NOT NULL,
    'user_rating', v_rating.rating
  );

  RETURN v_result;
END;
$$;

-- 6. Update get_fireside_data to include MC results
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
                FROM responses r WHERE r.id = qa.response_id
              ),
              'votes', (
                SELECT COUNT(*) FROM quiplash_votes qv
                WHERE qv.matchup_id = qa.matchup_id
                AND qv.voted_for_user_id = qa.user_id
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

-- 6. Seed example prompts for new features

-- "Guess the Group" / Majority Guess prompts
INSERT INTO prompts (type, content, title, category, options, is_majority_guess, is_active) VALUES
  ('multiple_choice', 'Which vacation would most people in this group choose?', 'Dream Vacation', 'multiple_choice', '["Beach resort", "Mountain cabin", "City exploration", "Road trip"]', true, true),
  ('multiple_choice', 'What would most of us order at a restaurant?', 'Group Order', 'multiple_choice', '["Something spicy", "Comfort food", "Something healthy", "The special"]', true, true),
  ('multiple_choice', 'Pick your ideal weekend. Guess what most others will pick!', 'Weekend Plans', 'multiple_choice', '["Lazy at home", "Outdoors adventure", "Social gathering", "Productive errands"]', true, true)
ON CONFLICT DO NOTHING;

-- More "Most Likely To" prompts with is_most_likely flag
INSERT INTO prompts (type, content, title, category, is_most_likely, is_active) VALUES
  ('multiple_choice', 'Who is most likely to accidentally reply-all to a work email?', 'Reply All', 'multiple_choice', true, true),
  ('multiple_choice', 'Who would win in a trivia night?', 'Trivia Champ', 'multiple_choice', true, true),
  ('multiple_choice', 'Who is most likely to cry during a movie?', 'Movie Crier', 'multiple_choice', true, true),
  ('multiple_choice', 'Who takes the longest to get ready?', 'Getting Ready', 'multiple_choice', true, true)
ON CONFLICT DO NOTHING;

-- Done! This enables:
-- 1. get_multiple_choice_results(group_prompt_id) - returns vote counts per option
-- 2. get_multiple_choice_voters(group_prompt_id) - returns who voted for what
-- 3. get_majority_guessing_results(group_prompt_id) - for majority guessing game
-- 4. Updated get_fireside_data now includes mc_results for MC prompts
-- 5. is_majority_guess flag for "Guess the Group" prompts
