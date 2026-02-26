-- Migration 143: Photo Completion Game
-- Phase 1: User submits a cutoff photo (body cut off at edge of frame)
-- Phase 2: Another user "completes" the photo (draws/photographs what's out of frame)
-- AI merges the two photos for Fireside reveal

-- =====================================================
-- 1. Create photo_completion_game_state table
-- =====================================================
CREATE TABLE IF NOT EXISTS photo_completion_game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  phase TEXT NOT NULL DEFAULT 'submit_cutoff'
    CHECK (phase IN ('submit_cutoff', 'submit_completion', 'complete')),
  cutoff_group_prompt_id UUID REFERENCES group_prompts(id),
  completion_group_prompt_id UUID REFERENCES group_prompts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_photo_completion_state_group ON photo_completion_game_state(group_id);
CREATE INDEX IF NOT EXISTS idx_photo_completion_state_phase ON photo_completion_game_state(phase);

-- RLS
ALTER TABLE photo_completion_game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view photo completion game state" ON photo_completion_game_state
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = photo_completion_game_state.group_id AND gm.user_id = auth.uid()
  )
);

-- =====================================================
-- 2. Create photo_completion_assignments table
-- =====================================================
CREATE TABLE IF NOT EXISTS photo_completion_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES photo_completion_game_state(id) ON DELETE CASCADE,
  original_user_id UUID NOT NULL REFERENCES auth.users(id),
  completer_user_id UUID NOT NULL REFERENCES auth.users(id),
  original_response_id UUID REFERENCES responses(id),
  completion_response_id UUID REFERENCES responses(id),
  merged_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id, original_user_id),
  UNIQUE(game_id, completer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_completion_assignments_game ON photo_completion_assignments(game_id);

-- RLS
ALTER TABLE photo_completion_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view photo completion assignments" ON photo_completion_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM photo_completion_game_state gs
    JOIN group_members gm ON gm.group_id = gs.group_id
    WHERE gs.id = photo_completion_assignments.game_id AND gm.user_id = auth.uid()
  )
);

-- =====================================================
-- 3. RPC: get_photo_completion_status
-- Returns current photo completion game state for a group
-- =====================================================
CREATE OR REPLACE FUNCTION get_photo_completion_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_game RECORD;
  v_assignment RECORD;
  v_has_submitted BOOLEAN := false;
  v_assigned_photo_url TEXT;
  v_assigned_username TEXT;
BEGIN
  -- Get current or most recent active game
  SELECT * INTO v_game
  FROM photo_completion_game_state
  WHERE group_id = p_group_id AND phase != 'complete'
  ORDER BY week_of DESC LIMIT 1;

  IF v_game.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get user's assignment
  SELECT * INTO v_assignment
  FROM photo_completion_assignments
  WHERE game_id = v_game.id
    AND (original_user_id = auth.uid() OR completer_user_id = auth.uid());

  -- Check submission status based on phase
  IF v_game.phase = 'submit_cutoff' THEN
    -- User needs to submit their cutoff photo
    v_has_submitted := v_assignment.original_response_id IS NOT NULL
      AND v_assignment.original_user_id = auth.uid();
    -- Also check if they are a completer and the original user submitted
    IF v_assignment.completer_user_id = auth.uid() THEN
      -- As completer in phase 1, nothing to do yet
      v_has_submitted := true;
    END IF;
    -- Actually: in phase 1, everyone submits a cutoff photo (they are ALL original_user_id for their own row)
    SELECT EXISTS (
      SELECT 1 FROM photo_completion_assignments pca
      WHERE pca.game_id = v_game.id
        AND pca.original_user_id = auth.uid()
        AND pca.original_response_id IS NOT NULL
    ) INTO v_has_submitted;

  ELSIF v_game.phase = 'submit_completion' THEN
    -- User needs to submit their completion photo
    SELECT EXISTS (
      SELECT 1 FROM photo_completion_assignments pca
      WHERE pca.game_id = v_game.id
        AND pca.completer_user_id = auth.uid()
        AND pca.completion_response_id IS NOT NULL
    ) INTO v_has_submitted;

    -- Get the original photo they need to complete (via signed URL on client side)
    SELECT r.media_url, p.username
    INTO v_assigned_photo_url, v_assigned_username
    FROM photo_completion_assignments pca
    JOIN responses r ON r.id = pca.original_response_id
    JOIN profiles p ON p.id = pca.original_user_id
    WHERE pca.game_id = v_game.id
      AND pca.completer_user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object(
    'id', v_game.id,
    'group_id', v_game.group_id,
    'week_of', v_game.week_of,
    'phase', v_game.phase,
    'cutoff_group_prompt_id', v_game.cutoff_group_prompt_id,
    'completion_group_prompt_id', v_game.completion_group_prompt_id,
    'has_submitted', v_has_submitted,
    'assigned_photo_url', v_assigned_photo_url,
    'assigned_username', v_assigned_username
  );
END;
$$;

-- =====================================================
-- 4. RPC: advance_photo_completion_game
-- Called by cron or manually to progress games
-- =====================================================
CREATE OR REPLACE FUNCTION advance_photo_completion_game()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_game RECORD;
  v_results JSONB := '[]'::jsonb;
BEGIN
  -- Phase 1 → 2: submit_cutoff → submit_completion (when cutoff prompt expires)
  FOR v_game IN (
    SELECT pcgs.*, gp.expires_at as prompt_expires
    FROM photo_completion_game_state pcgs
    JOIN group_prompts gp ON gp.id = pcgs.cutoff_group_prompt_id
    WHERE pcgs.phase = 'submit_cutoff'
      AND gp.expires_at <= NOW()
  ) LOOP
    UPDATE photo_completion_game_state
    SET phase = 'submit_completion'
    WHERE id = v_game.id;

    v_results := v_results || jsonb_build_object('game_id', v_game.id, 'action', 'advanced_to_submit_completion');
  END LOOP;

  -- Phase 2 → complete: submit_completion → complete (when completion prompt expires)
  FOR v_game IN (
    SELECT pcgs.*, gp.expires_at as prompt_expires
    FROM photo_completion_game_state pcgs
    JOIN group_prompts gp ON gp.id = pcgs.completion_group_prompt_id
    WHERE pcgs.phase = 'submit_completion'
      AND gp.expires_at <= NOW()
  ) LOOP
    UPDATE photo_completion_game_state
    SET phase = 'complete'
    WHERE id = v_game.id;

    v_results := v_results || jsonb_build_object('game_id', v_game.id, 'action', 'completed');
  END LOOP;

  RETURN v_results;
END;
$$;

-- =====================================================
-- 5. RPC: get_photo_completion_results (for Fireside)
-- Returns all pairs with photo URLs
-- =====================================================
CREATE OR REPLACE FUNCTION get_photo_completion_results(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_game RECORD;
  v_pairs JSONB;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', NOW())::DATE);

  SELECT * INTO v_game
  FROM photo_completion_game_state
  WHERE group_id = p_group_id AND week_of = v_week;

  IF v_game.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'assignment_id', pca.id,
    'original_user_id', pca.original_user_id,
    'original_username', p_orig.username,
    'original_avatar', p_orig.avatar_config,
    'completer_user_id', pca.completer_user_id,
    'completer_username', p_comp.username,
    'completer_avatar', p_comp.avatar_config,
    'original_photo_url', r_orig.media_url,
    'completion_photo_url', r_comp.media_url,
    'merged_photo_url', pca.merged_photo_url
  )) INTO v_pairs
  FROM photo_completion_assignments pca
  JOIN profiles p_orig ON p_orig.id = pca.original_user_id
  JOIN profiles p_comp ON p_comp.id = pca.completer_user_id
  LEFT JOIN responses r_orig ON r_orig.id = pca.original_response_id
  LEFT JOIN responses r_comp ON r_comp.id = pca.completion_response_id
  WHERE pca.game_id = v_game.id;

  RETURN jsonb_build_object(
    'game_id', v_game.id,
    'phase', v_game.phase,
    'pairs', COALESCE(v_pairs, '[]'::jsonb)
  );
END;
$$;

-- =====================================================
-- 6. Update schedule_all_groups to also advance photo completion games
-- =====================================================
CREATE OR REPLACE FUNCTION schedule_all_groups()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group RECORD;
  v_results JSONB := '[]'::JSONB;
  v_result JSONB;
  v_meme_advances JSONB;
  v_photo_completion_advances JSONB;
BEGIN
  -- First, advance any meme games that need phase progression
  v_meme_advances := advance_meme_game();

  -- Advance any photo completion games
  v_photo_completion_advances := advance_photo_completion_game();

  -- Then schedule daily prompts for all groups
  FOR v_group IN
    SELECT DISTINCT g.id
    FROM groups g
    INNER JOIN group_members gm ON gm.group_id = g.id
  LOOP
    v_result := schedule_daily_prompt(v_group.id);
    v_results := v_results || jsonb_build_object('group_id', v_group.id, 'result', v_result);
  END LOOP;

  RETURN jsonb_build_object(
    'prompts', v_results,
    'meme_advances', v_meme_advances,
    'photo_completion_advances', v_photo_completion_advances
  );
END;
$$;

-- =====================================================
-- 7. Update get_fireside_data to include photo completion results
-- =====================================================
CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
  v_winner JSONB;
  v_meme_data JSONB;
  v_photo_completion_data JSONB;
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
      'payload', p.payload,
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

  -- Get photo completion data for this week
  v_photo_completion_data := get_photo_completion_results(p_group_id, v_week);

  -- Get leaderboard
  v_leaderboard := (SELECT jsonb_agg(lb) FROM (
    SELECT jsonb_build_object(
      'user_id', wp.user_id,
      'username', pr.username,
      'avatar_config', pr.avatar_config,
      'points_answering', wp.points_answering,
      'points_voting', wp.points_voting,
      'points_quiplash_wins', wp.points_quiplash_wins,
      'total_points', wp.total_points
    ) as lb
    FROM weekly_points wp
    LEFT JOIN profiles pr ON pr.id = wp.user_id
    WHERE wp.group_id = p_group_id AND wp.week_of = v_week
    ORDER BY wp.total_points DESC
  ) sub2);

  -- Get winner
  v_winner := (
    SELECT jsonb_build_object(
      'user_id', ww.user_id,
      'username', pr.username,
      'avatar_config', pr.avatar_config,
      'has_chosen', ww.has_chosen,
      'chosen_prompt_id', ww.chosen_prompt_id,
      'custom_prompt_content', ww.custom_prompt_content
    )
    FROM weekly_winners ww
    LEFT JOIN profiles pr ON pr.id = ww.user_id
    WHERE ww.group_id = p_group_id AND ww.week_of = v_week
    LIMIT 1
  );

  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'winner', v_winner,
    'meme_data', v_meme_data,
    'photo_completion_data', v_photo_completion_data
  );
END;
$$;
