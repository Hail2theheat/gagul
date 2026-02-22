-- Migration 138: What do you Meme - 3-day weekly meme game
-- Day 1: Designated uploader uploads photo + writes caption
-- Day 2: Everyone else writes a caption
-- Day 3: Everyone votes (can't vote for own caption)

-- =====================================================
-- 1. Create meme_game_state table
-- =====================================================
CREATE TABLE IF NOT EXISTS meme_game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  phase TEXT NOT NULL DEFAULT 'photo_upload'
    CHECK (phase IN ('photo_upload', 'captioning', 'voting', 'complete')),
  photo_uploader_id UUID NOT NULL REFERENCES auth.users(id),
  photo_url TEXT,
  photo_group_prompt_id UUID REFERENCES group_prompts(id),
  caption_group_prompt_id UUID REFERENCES group_prompts(id),
  winner_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_meme_game_state_group ON meme_game_state(group_id);
CREATE INDEX IF NOT EXISTS idx_meme_game_state_phase ON meme_game_state(phase);

-- RLS
ALTER TABLE meme_game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meme game state" ON meme_game_state
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = meme_game_state.group_id AND gm.user_id = auth.uid()
  )
);

-- =====================================================
-- 2. Update type constraint for new prompt types
-- =====================================================
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_type_check;
ALTER TABLE prompts ADD CONSTRAINT prompts_type_check
  CHECK (type IN ('short_text', 'long_text', 'photo', 'multiple_choice', 'quiz', 'quiplash', 'voice', 'video', 'photo_caption', 'meme_upload', 'meme_caption'));

-- =====================================================
-- 3. Seed template prompts for the meme game
-- =====================================================
INSERT INTO prompts (type, content, title, category, is_active) VALUES
  ('meme_upload', 'Upload a photo and write a caption!', 'What do you Meme', 'meme', true),
  ('meme_caption', 'Write your funniest caption!', 'What do you Meme', 'meme', true);

-- Deactivate old photo_caption prompts (replaced by meme game)
UPDATE prompts SET is_active = false WHERE type = 'photo_caption';

-- =====================================================
-- 4. Update category rotation: photo_caption → meme
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_category(current_category TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN CASE current_category
    WHEN 'text' THEN 'text_silly'
    WHEN 'text_silly' THEN 'multiple_choice'
    WHEN 'multiple_choice' THEN 'photo'
    WHEN 'photo' THEN 'quiplash'
    WHEN 'quiplash' THEN 'meme'
    WHEN 'meme' THEN 'text'
    -- Legacy compat
    WHEN 'photo_caption' THEN 'text'
    ELSE 'text'
  END;
END;
$$;

-- =====================================================
-- 5. RPC: schedule_meme_game
-- Called when rotation hits 'meme' category
-- =====================================================
CREATE OR REPLACE FUNCTION schedule_meme_game(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_today DATE;
  v_week_of DATE;
  v_uploader_id UUID;
  v_prompt RECORD;
  v_gp_id UUID;
  v_game_id UUID;
  v_scheduled_time TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_today := (NOW() AT TIME ZONE 'America/New_York')::DATE;
  v_week_of := date_trunc('week', v_today)::DATE;

  -- Check if game already exists this week
  IF EXISTS (
    SELECT 1 FROM meme_game_state
    WHERE group_id = p_group_id AND week_of = v_week_of
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Meme game already exists this week');
  END IF;

  -- Determine photo uploader: previous week's winner, fallback to group creator
  SELECT winner_user_id INTO v_uploader_id
  FROM meme_game_state
  WHERE group_id = p_group_id AND phase = 'complete' AND winner_user_id IS NOT NULL
  ORDER BY week_of DESC LIMIT 1;

  -- Check if winner is still in the group
  IF v_uploader_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = p_group_id AND user_id = v_uploader_id
  ) THEN
    v_uploader_id := NULL;
  END IF;

  -- Fallback to group creator
  IF v_uploader_id IS NULL THEN
    SELECT created_by INTO v_uploader_id FROM groups WHERE id = p_group_id;
  END IF;

  IF v_uploader_id IS NULL THEN
    -- Last resort: pick random member
    SELECT user_id INTO v_uploader_id FROM group_members
    WHERE group_id = p_group_id ORDER BY RANDOM() LIMIT 1;
  END IF;

  IF v_uploader_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No members in group');
  END IF;

  -- Get the meme_upload prompt template
  SELECT * INTO v_prompt FROM prompts WHERE type = 'meme_upload' AND is_active = true LIMIT 1;
  IF v_prompt.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'No meme_upload prompt found');
  END IF;

  -- Schedule Day 1 prompt (same timing as regular daily prompts)
  v_scheduled_time := (v_today + INTERVAL '3 hours 1 minute') AT TIME ZONE 'America/New_York';
  v_expires_at := ((v_today + INTERVAL '1 day') + INTERVAL '3 hours') AT TIME ZONE 'America/New_York';

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (p_group_id, v_prompt.id, v_scheduled_time, v_expires_at, v_week_of, true)
  RETURNING id INTO v_gp_id;

  -- Create game state
  INSERT INTO meme_game_state (group_id, week_of, phase, photo_uploader_id, photo_group_prompt_id)
  VALUES (p_group_id, v_week_of, 'photo_upload', v_uploader_id, v_gp_id)
  RETURNING id INTO v_game_id;

  RETURN jsonb_build_object(
    'success', true,
    'game_id', v_game_id,
    'uploader_id', v_uploader_id,
    'group_prompt_id', v_gp_id
  );
END;
$$;

-- =====================================================
-- 6. RPC: advance_meme_game
-- Called daily by cron to progress games through phases
-- =====================================================
CREATE OR REPLACE FUNCTION advance_meme_game()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_game RECORD;
  v_prompt RECORD;
  v_gp_id UUID;
  v_today DATE;
  v_scheduled_time TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_winner_id UUID;
  v_max_votes INT;
  v_results JSONB := '[]'::jsonb;
BEGIN
  v_today := (NOW() AT TIME ZONE 'America/New_York')::DATE;

  -- Phase 1 → 2: photo_upload → captioning (if photo was uploaded and Day 1 expired)
  FOR v_game IN (
    SELECT mgs.*, gp.expires_at as prompt_expires
    FROM meme_game_state mgs
    JOIN group_prompts gp ON gp.id = mgs.photo_group_prompt_id
    WHERE mgs.phase = 'photo_upload'
      AND gp.expires_at <= NOW()
      AND mgs.photo_url IS NOT NULL
  ) LOOP
    -- Get meme_caption prompt template
    SELECT * INTO v_prompt FROM prompts WHERE type = 'meme_caption' AND is_active = true LIMIT 1;

    IF v_prompt.id IS NOT NULL THEN
      -- Create Day 2 group_prompt
      v_scheduled_time := (v_today + INTERVAL '3 hours 1 minute') AT TIME ZONE 'America/New_York';
      v_expires_at := ((v_today + INTERVAL '1 day') + INTERVAL '3 hours') AT TIME ZONE 'America/New_York';

      INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
      VALUES (v_game.group_id, v_prompt.id, v_scheduled_time, v_expires_at, v_game.week_of, true)
      RETURNING id INTO v_gp_id;

      UPDATE meme_game_state
      SET phase = 'captioning', caption_group_prompt_id = v_gp_id
      WHERE id = v_game.id;

      v_results := v_results || jsonb_build_object('game_id', v_game.id, 'action', 'advanced_to_captioning');
    END IF;
  END LOOP;

  -- Phase 2 → 3: captioning → voting (Day 2 expired)
  FOR v_game IN (
    SELECT mgs.*, gp.expires_at as prompt_expires
    FROM meme_game_state mgs
    JOIN group_prompts gp ON gp.id = mgs.caption_group_prompt_id
    WHERE mgs.phase = 'captioning'
      AND gp.expires_at <= NOW()
  ) LOOP
    UPDATE meme_game_state SET phase = 'voting' WHERE id = v_game.id;
    v_results := v_results || jsonb_build_object('game_id', v_game.id, 'action', 'advanced_to_voting');
  END LOOP;

  -- Phase 3 → complete: voting → complete (24h after voting started)
  FOR v_game IN (
    SELECT mgs.*
    FROM meme_game_state mgs
    WHERE mgs.phase = 'voting'
      -- Voting lasts ~24h. Check if caption prompt expired > 24h ago
      AND EXISTS (
        SELECT 1 FROM group_prompts gp
        WHERE gp.id = mgs.caption_group_prompt_id
        AND gp.expires_at <= NOW() - INTERVAL '24 hours'
      )
  ) LOOP
    -- Calculate winner: most votes on the caption_group_prompt_id
    SELECT cv.voted_for_response_id, COUNT(*) as vote_count
    INTO v_winner_id, v_max_votes
    FROM caption_votes cv
    WHERE cv.group_prompt_id = v_game.caption_group_prompt_id
    GROUP BY cv.voted_for_response_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- Get the user_id of the winner's response
    IF v_winner_id IS NOT NULL THEN
      SELECT user_id INTO v_winner_id FROM responses WHERE id = v_winner_id;
    END IF;

    UPDATE meme_game_state
    SET phase = 'complete', winner_user_id = v_winner_id
    WHERE id = v_game.id;

    v_results := v_results || jsonb_build_object('game_id', v_game.id, 'action', 'completed', 'winner', v_winner_id);
  END LOOP;

  -- Also handle stale photo_upload games where uploader never uploaded (>48h)
  UPDATE meme_game_state
  SET phase = 'complete'
  WHERE phase = 'photo_upload'
    AND photo_url IS NULL
    AND created_at <= NOW() - INTERVAL '48 hours';

  RETURN v_results;
END;
$$;

-- =====================================================
-- 7. RPC: submit_meme_photo
-- =====================================================
CREATE OR REPLACE FUNCTION submit_meme_photo(
  p_group_id UUID,
  p_photo_url TEXT,
  p_caption TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_game RECORD;
  v_response_id UUID;
BEGIN
  -- Get active game for this group
  SELECT * INTO v_game
  FROM meme_game_state
  WHERE group_id = p_group_id AND phase = 'photo_upload'
  ORDER BY week_of DESC LIMIT 1;

  IF v_game.id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active meme game in photo_upload phase');
  END IF;

  -- Verify caller is the designated uploader
  IF v_game.photo_uploader_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'You are not the designated photo uploader');
  END IF;

  -- Verify photo not already uploaded
  IF v_game.photo_url IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Photo already uploaded');
  END IF;

  -- Update game state with photo
  UPDATE meme_game_state
  SET photo_url = p_photo_url
  WHERE id = v_game.id;

  -- Create uploader's caption as a response on the photo group_prompt
  INSERT INTO responses (group_prompt_id, user_id, content, submitted_at)
  VALUES (v_game.photo_group_prompt_id, auth.uid(), p_caption, NOW())
  RETURNING id INTO v_response_id;

  RETURN jsonb_build_object('success', true, 'game_id', v_game.id, 'response_id', v_response_id);
END;
$$;

-- =====================================================
-- 8. RPC: get_meme_game_status
-- Returns current meme game state for a group
-- =====================================================
CREATE OR REPLACE FUNCTION get_meme_game_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_game RECORD;
  v_has_submitted BOOLEAN := false;
  v_uploader_username TEXT;
  v_uploader_avatar JSONB;
BEGIN
  -- Get current or most recent active game
  SELECT * INTO v_game
  FROM meme_game_state
  WHERE group_id = p_group_id AND phase != 'complete'
  ORDER BY week_of DESC LIMIT 1;

  IF v_game.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get uploader info
  SELECT username, avatar_config INTO v_uploader_username, v_uploader_avatar
  FROM profiles WHERE id = v_game.photo_uploader_id;

  -- Check if current user has submitted (caption or photo)
  IF v_game.phase = 'photo_upload' THEN
    v_has_submitted := v_game.photo_url IS NOT NULL AND v_game.photo_uploader_id = auth.uid();
  ELSIF v_game.phase = 'captioning' AND v_game.caption_group_prompt_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM responses
      WHERE group_prompt_id = v_game.caption_group_prompt_id AND user_id = auth.uid()
    ) INTO v_has_submitted;
    -- Uploader already submitted on Day 1, so they're done for captioning
    IF v_game.photo_uploader_id = auth.uid() THEN
      v_has_submitted := true;
    END IF;
  ELSIF v_game.phase = 'voting' THEN
    -- Check if voted (votes are on the caption_group_prompt_id)
    SELECT EXISTS (
      SELECT 1 FROM caption_votes
      WHERE group_prompt_id = v_game.caption_group_prompt_id AND voter_id = auth.uid()
    ) INTO v_has_submitted;
  END IF;

  RETURN jsonb_build_object(
    'id', v_game.id,
    'group_id', v_game.group_id,
    'week_of', v_game.week_of,
    'phase', v_game.phase,
    'photo_uploader_id', v_game.photo_uploader_id,
    'uploader_username', v_uploader_username,
    'uploader_avatar', v_uploader_avatar,
    'photo_url', v_game.photo_url,
    'photo_group_prompt_id', v_game.photo_group_prompt_id,
    'caption_group_prompt_id', v_game.caption_group_prompt_id,
    'has_submitted', v_has_submitted,
    'is_uploader', v_game.photo_uploader_id = auth.uid()
  );
END;
$$;

-- =====================================================
-- 9. RPC: get_meme_voting_data
-- Returns photo + captions for voting (excludes caller's caption)
-- =====================================================
CREATE OR REPLACE FUNCTION get_meme_voting_data(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_game RECORD;
  v_responses JSONB;
  v_has_voted BOOLEAN;
  v_voted_for UUID;
BEGIN
  -- Get game in voting phase
  SELECT * INTO v_game
  FROM meme_game_state
  WHERE group_id = p_group_id AND phase = 'voting'
  ORDER BY week_of DESC LIMIT 1;

  IF v_game.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get all captions (from both Day 1 photo_group_prompt and Day 2 caption_group_prompt)
  SELECT jsonb_agg(jsonb_build_object(
    'response_id', r.id,
    'content', r.content,
    'user_id', r.user_id
  )) INTO v_responses
  FROM responses r
  WHERE r.group_prompt_id IN (v_game.photo_group_prompt_id, v_game.caption_group_prompt_id);

  -- Check if user has already voted
  SELECT EXISTS (
    SELECT 1 FROM caption_votes
    WHERE group_prompt_id = v_game.caption_group_prompt_id AND voter_id = auth.uid()
  ) INTO v_has_voted;

  SELECT voted_for_response_id INTO v_voted_for
  FROM caption_votes
  WHERE group_prompt_id = v_game.caption_group_prompt_id AND voter_id = auth.uid();

  RETURN jsonb_build_object(
    'game_id', v_game.id,
    'photo_url', v_game.photo_url,
    'caption_group_prompt_id', v_game.caption_group_prompt_id,
    'responses', COALESCE(v_responses, '[]'::jsonb),
    'has_voted', v_has_voted,
    'voted_for', v_voted_for
  );
END;
$$;

-- =====================================================
-- 10. RPC: get_meme_results (for fireside)
-- =====================================================
CREATE OR REPLACE FUNCTION get_meme_results(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_game RECORD;
  v_captions JSONB;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', NOW())::DATE);

  SELECT * INTO v_game
  FROM meme_game_state
  WHERE group_id = p_group_id AND week_of = v_week;

  IF v_game.id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get all captions with vote counts and author info
  SELECT jsonb_agg(
    jsonb_build_object(
      'response_id', r.id,
      'user_id', r.user_id,
      'username', p.username,
      'avatar_config', p.avatar_config,
      'content', r.content,
      'votes', COALESCE((
        SELECT COUNT(*) FROM caption_votes cv
        WHERE cv.voted_for_response_id = r.id
          AND cv.group_prompt_id = v_game.caption_group_prompt_id
      ), 0)
    )
    ORDER BY COALESCE((
      SELECT COUNT(*) FROM caption_votes cv
      WHERE cv.voted_for_response_id = r.id
        AND cv.group_prompt_id = v_game.caption_group_prompt_id
    ), 0) DESC
  ) INTO v_captions
  FROM responses r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.group_prompt_id IN (v_game.photo_group_prompt_id, v_game.caption_group_prompt_id);

  RETURN jsonb_build_object(
    'game_id', v_game.id,
    'phase', v_game.phase,
    'photo_url', v_game.photo_url,
    'photo_uploader_id', v_game.photo_uploader_id,
    'winner_user_id', v_game.winner_user_id,
    'captions', COALESCE(v_captions, '[]'::jsonb)
  );
END;
$$;

-- =====================================================
-- 11. Update schedule_daily_prompt to trigger meme game
-- =====================================================
CREATE OR REPLACE FUNCTION schedule_daily_prompt(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_state RECORD;
  v_next_category TEXT;
  v_prompt RECORD;
  v_scheduled_time TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_today DATE;
  v_week_of DATE;
  v_meme_result JSONB;
BEGIN
  v_today := (NOW() AT TIME ZONE 'America/New_York')::DATE;

  -- Check if already scheduled for today (exclude meme prompts from this check)
  IF EXISTS (
    SELECT 1 FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
    AND (gp.scheduled_for AT TIME ZONE 'America/New_York')::DATE = v_today
    AND gp.is_active = true
    AND p.type NOT IN ('meme_upload', 'meme_caption')
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already scheduled for today');
  END IF;

  -- Get or create schedule state
  INSERT INTO group_schedule_state (group_id, last_category)
  VALUES (p_group_id, 'quiplash')
  ON CONFLICT (group_id) DO NOTHING;

  SELECT * INTO v_state FROM group_schedule_state WHERE group_id = p_group_id;

  -- Get next category
  v_next_category := get_next_category(v_state.last_category);

  -- If category is 'meme', trigger the meme game instead of a regular prompt
  IF v_next_category = 'meme' THEN
    v_meme_result := schedule_meme_game(p_group_id);

    -- Update category state regardless of meme game success
    UPDATE group_schedule_state
    SET last_category = 'meme', last_scheduled_at = NOW()
    WHERE group_id = p_group_id;

    -- Still schedule a regular prompt too (meme game is ALONGSIDE daily prompt)
    -- Get a text prompt as the regular daily prompt
    SELECT * INTO v_prompt
    FROM prompts
    WHERE category = 'text' AND is_active = true
    ORDER BY times_used ASC, RANDOM()
    LIMIT 1;

    IF v_prompt.id IS NOT NULL THEN
      v_scheduled_time := (v_today + INTERVAL '3 hours 1 minute') AT TIME ZONE 'America/New_York';
      v_expires_at := ((v_today + INTERVAL '1 day') + INTERVAL '3 hours') AT TIME ZONE 'America/New_York';
      v_week_of := date_trunc('week', v_today)::DATE;

      INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
      VALUES (p_group_id, v_prompt.id, v_scheduled_time, v_expires_at, v_week_of, true);

      UPDATE prompts SET times_used = times_used + 1 WHERE id = v_prompt.id;
    END IF;

    RETURN jsonb_build_object('success', true, 'category', 'meme', 'meme_result', v_meme_result);
  END IF;

  -- Regular prompt scheduling (unchanged)
  SELECT * INTO v_prompt
  FROM prompts
  WHERE category = v_next_category AND is_active = true
  ORDER BY times_used ASC, RANDOM()
  LIMIT 1;

  IF v_prompt.id IS NULL THEN
    SELECT * INTO v_prompt
    FROM prompts WHERE is_active = true
    ORDER BY times_used ASC, RANDOM()
    LIMIT 1;

    IF v_prompt.id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'No prompts available');
    END IF;
  END IF;

  v_scheduled_time := (v_today + INTERVAL '3 hours 1 minute') AT TIME ZONE 'America/New_York';
  v_expires_at := ((v_today + INTERVAL '1 day') + INTERVAL '3 hours') AT TIME ZONE 'America/New_York';
  v_week_of := date_trunc('week', v_today)::DATE;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (p_group_id, v_prompt.id, v_scheduled_time, v_expires_at, v_week_of, true);

  UPDATE group_schedule_state
  SET last_category = v_next_category, last_scheduled_at = NOW()
  WHERE group_id = p_group_id;

  UPDATE prompts SET times_used = times_used + 1 WHERE id = v_prompt.id;

  RETURN jsonb_build_object(
    'success', true,
    'prompt_id', v_prompt.id,
    'category', v_next_category,
    'scheduled_for', v_scheduled_time,
    'expires_at', v_expires_at
  );
END;
$$;

-- =====================================================
-- 12. Update schedule_all_groups to also advance meme games
-- =====================================================
CREATE OR REPLACE FUNCTION schedule_all_groups()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group RECORD;
  v_results JSONB := '[]'::JSONB;
  v_result JSONB;
  v_meme_advances JSONB;
BEGIN
  -- First, advance any meme games that need phase progression
  v_meme_advances := advance_meme_game();

  -- Then schedule daily prompts for all groups
  FOR v_group IN
    SELECT DISTINCT g.id
    FROM groups g
    INNER JOIN group_members gm ON gm.group_id = g.id
  LOOP
    v_result := schedule_daily_prompt(v_group.id);
    v_results := v_results || jsonb_build_object('group_id', v_group.id, 'result', v_result);
  END LOOP;

  RETURN jsonb_build_object('prompts', v_results, 'meme_advances', v_meme_advances);
END;
$$;

-- =====================================================
-- 13. Update get_fireside_data to include meme game results
-- =====================================================
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
    'meme_data', v_meme_data
  );
END;
$$;
