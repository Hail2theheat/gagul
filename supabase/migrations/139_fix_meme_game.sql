-- Fix 1: submit_meme_photo - cast content to jsonb
-- Fix 2: get_group_status - exclude meme_upload/meme_caption from active prompt

-- =====================================================
-- Fix submit_meme_photo: content column is jsonb, need cast
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
  SELECT * INTO v_game
  FROM meme_game_state
  WHERE group_id = p_group_id AND phase = 'photo_upload'
  ORDER BY week_of DESC LIMIT 1;

  IF v_game.id IS NULL THEN
    RETURN jsonb_build_object('error', 'No active meme game in photo_upload phase');
  END IF;

  IF v_game.photo_uploader_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'You are not the designated photo uploader');
  END IF;

  IF v_game.photo_url IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Photo already uploaded');
  END IF;

  UPDATE meme_game_state
  SET photo_url = p_photo_url
  WHERE id = v_game.id;

  INSERT INTO responses (group_prompt_id, user_id, content, submitted_at)
  VALUES (v_game.photo_group_prompt_id, auth.uid(), to_jsonb(p_caption), NOW())
  RETURNING id INTO v_response_id;

  RETURN jsonb_build_object('success', true, 'game_id', v_game.id, 'response_id', v_response_id);
END;
$$;

-- =====================================================
-- Fix get_group_status: exclude meme prompts from active prompt
-- =====================================================
CREATE OR REPLACE FUNCTION get_group_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_active RECORD;
  v_response_id UUID;
  v_rating_id UUID;
  v_rating_value INTEGER;
  v_members JSONB;
  v_has_responded BOOLEAN := false;
  v_has_rated BOOLEAN := false;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Find first unanswered, non-meme active prompt
  SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer,
         p.category, p.payload, p.is_most_likely, p.is_majority_guess
  INTO v_active
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id
    AND gp.scheduled_for <= now()
    AND gp.expires_at > now()
    AND gp.is_active = true
    AND p.type NOT IN ('meme_upload', 'meme_caption')
    AND NOT EXISTS (
      SELECT 1 FROM responses r
      WHERE r.group_prompt_id = gp.id AND r.user_id = auth.uid()
    )
  ORDER BY gp.scheduled_for ASC
  LIMIT 1;

  IF v_active.id IS NULL THEN
    -- Check for any active non-meme prompt (user already responded)
    SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer,
           p.category, p.payload, p.is_most_likely, p.is_majority_guess
    INTO v_active
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND gp.scheduled_for <= now()
      AND gp.expires_at > now()
      AND gp.is_active = true
      AND p.type NOT IN ('meme_upload', 'meme_caption')
    ORDER BY gp.scheduled_for DESC
    LIMIT 1;

    v_has_responded := true;
  END IF;

  IF v_active.id IS NOT NULL THEN
    v_expires_at := v_active.expires_at;

    SELECT id, rating INTO v_rating_id, v_rating_value
    FROM prompt_ratings
    WHERE prompt_id = v_active.pid AND user_id = auth.uid();

    v_has_rated := v_rating_id IS NOT NULL;

    IF v_active.is_most_likely THEN
      v_members := get_group_members_with_avatars(p_group_id);
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'active_prompt_instance', CASE WHEN v_active.id IS NOT NULL AND NOT v_has_responded THEN jsonb_build_object(
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
    'active_expires_at', v_expires_at,
    'has_responded', v_has_responded,
    'has_rated', v_has_rated,
    'user_rating', v_rating_value
  );

  RETURN v_result;
END;
$$;
