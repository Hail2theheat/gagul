-- Fix: show green if user responded to ANY active prompt (not all).
-- With quiplash, users are only assigned to one matchup, so they
-- can't be expected to respond to every active prompt.

CREATE OR REPLACE FUNCTION get_member_prompt_statuses(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_has_active BOOLEAN;
BEGIN
  -- Check if there are any active prompts
  SELECT EXISTS (
    SELECT 1 FROM group_prompts gp
    WHERE gp.group_id = p_group_id
      AND gp.scheduled_for <= now()
      AND gp.expires_at > now()
      AND gp.is_active = true
  ) INTO v_has_active;

  IF NOT v_has_active THEN
    RETURN '[]'::JSONB;
  END IF;

  -- For each member, check if they responded to or viewed ANY active prompt
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', member_status.user_id,
      'status', CASE
        WHEN member_status.has_responded THEN 'responded'
        WHEN member_status.has_seen THEN 'seen'
        ELSE 'not_seen'
      END
    )
  ) INTO v_result
  FROM (
    SELECT
      gm.user_id,
      EXISTS (
        SELECT 1 FROM responses r
        JOIN group_prompts gp ON gp.id = r.group_prompt_id
        WHERE r.user_id = gm.user_id
          AND gp.group_id = p_group_id
          AND gp.scheduled_for <= now()
          AND gp.expires_at > now()
          AND gp.is_active = true
      ) as has_responded,
      EXISTS (
        SELECT 1 FROM prompt_views pv
        JOIN group_prompts gp ON gp.id = pv.group_prompt_id
        WHERE pv.user_id = gm.user_id
          AND gp.group_id = p_group_id
          AND gp.scheduled_for <= now()
          AND gp.expires_at > now()
          AND gp.is_active = true
      ) as has_seen
    FROM group_members gm
    WHERE gm.group_id = p_group_id
  ) member_status;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
