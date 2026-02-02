-- Updated get_group_status RPC - always returns prompt info for rating
CREATE OR REPLACE FUNCTION get_group_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_active RECORD;
  v_response RECORD;
  v_rating RECORD;
BEGIN
  SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer, p.category, p.payload
  INTO v_active
  FROM group_prompts gp JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id AND gp.scheduled_for <= now() AND gp.expires_at > now() AND gp.is_active = true
  ORDER BY gp.scheduled_for DESC LIMIT 1;

  IF v_active.id IS NOT NULL THEN
    SELECT * INTO v_response FROM responses WHERE group_prompt_id = v_active.id AND user_id = auth.uid();
    SELECT * INTO v_rating FROM prompt_ratings WHERE prompt_id = v_active.pid AND user_id = auth.uid();
  END IF;

  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'active_prompt_instance', CASE WHEN v_active.id IS NOT NULL THEN jsonb_build_object(
      'id', v_active.id, 'prompt_id', v_active.pid, 'scheduled_for', v_active.scheduled_for,
      'expires_at', v_active.expires_at, 'week_of', v_active.week_of,
      'prompts', jsonb_build_object('id', v_active.pid, 'type', v_active.type, 'content', v_active.content,
        'title', v_active.title, 'options', v_active.options, 'correct_answer', v_active.correct_answer,
        'category', v_active.category, 'payload', v_active.payload)
    ) ELSE NULL END,
    'active_expires_at', v_active.expires_at,
    'has_responded', v_response.id IS NOT NULL,
    'has_rated', v_rating.id IS NOT NULL,
    'user_rating', v_rating.rating
  );
  RETURN v_result;
END;
$$;
