-- =====================================================
-- FIX: "record v_response is not assigned yet" error
-- The function tries to access v_response when no active prompt exists
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION get_group_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_active RECORD;
  v_response_id UUID;
  v_rating_id UUID;
  v_rating_value BOOLEAN;
  v_members JSONB;
  v_has_responded BOOLEAN := false;
  v_has_rated BOOLEAN := false;
  v_expires_at TIMESTAMPTZ;
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

  -- Only check responses if we have an active prompt
  IF v_active.id IS NOT NULL THEN
    v_expires_at := v_active.expires_at;

    -- Check if user has responded (using scalar variables, not RECORD)
    SELECT id INTO v_response_id
    FROM responses
    WHERE group_prompt_id = v_active.id AND user_id = auth.uid();

    v_has_responded := v_response_id IS NOT NULL;

    -- Check if user has rated
    SELECT id, rating INTO v_rating_id, v_rating_value
    FROM prompt_ratings
    WHERE prompt_id = v_active.pid AND user_id = auth.uid();

    v_has_rated := v_rating_id IS NOT NULL;

    -- Get members if this is a "most likely" prompt
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
