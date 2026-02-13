-- Fix: get_member_prompt_statuses should check ALL active prompts, not just one.
-- When multiple prompts are active simultaneously (e.g. two quiplash prompts),
-- the old function picked one arbitrarily and ignored the other, causing
-- incorrect status dots (blue instead of green).
--
-- New logic:
--   'responded'  = user responded to ALL active prompts
--   'seen'       = user has seen at least one but hasn't responded to all
--   'not_seen'   = user hasn't seen any active prompt

CREATE OR REPLACE FUNCTION get_member_prompt_statuses(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_active_count INTEGER;
  v_result JSONB;
BEGIN
  -- Count currently active prompts
  SELECT COUNT(*) INTO v_active_count
  FROM group_prompts gp
  WHERE gp.group_id = p_group_id
    AND gp.scheduled_for <= now()
    AND gp.expires_at > now()
    AND gp.is_active = true;

  -- If no active prompts, return empty array
  IF v_active_count = 0 THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Get status for each member across ALL active prompts
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', member_status.user_id,
      'status', CASE
        WHEN member_status.response_count >= v_active_count THEN 'responded'
        WHEN member_status.view_count > 0 THEN 'seen'
        ELSE 'not_seen'
      END
    )
  ) INTO v_result
  FROM (
    SELECT
      gm.user_id,
      COUNT(DISTINCT r.group_prompt_id) as response_count,
      COUNT(DISTINCT pv.group_prompt_id) as view_count
    FROM group_members gm
    CROSS JOIN group_prompts gp_active
    LEFT JOIN responses r
      ON r.group_prompt_id = gp_active.id AND r.user_id = gm.user_id
    LEFT JOIN prompt_views pv
      ON pv.group_prompt_id = gp_active.id AND pv.user_id = gm.user_id
    WHERE gm.group_id = p_group_id
      AND gp_active.group_id = p_group_id
      AND gp_active.scheduled_for <= now()
      AND gp_active.expires_at > now()
      AND gp_active.is_active = true
    GROUP BY gm.user_id
  ) member_status;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
