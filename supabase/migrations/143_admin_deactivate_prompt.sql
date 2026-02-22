-- Admin deactivate prompt RPC
-- Allows group members to deactivate a prompt in their group.
-- Uses SECURITY DEFINER to bypass missing UPDATE RLS policy on group_prompts.

CREATE OR REPLACE FUNCTION admin_deactivate_prompt(p_group_prompt_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Get the group_id for this group_prompt
  SELECT group_id INTO v_group_id
  FROM group_prompts WHERE id = p_group_prompt_id;

  IF v_group_id IS NULL THEN
    RETURN json_build_object('error', 'Prompt not found');
  END IF;

  -- Check caller is a member of this group
  IF NOT is_group_member(v_group_id, auth.uid()) THEN
    RETURN json_build_object('error', 'Not a member of this group');
  END IF;

  -- Deactivate
  UPDATE group_prompts SET is_active = false WHERE id = p_group_prompt_id;

  RETURN json_build_object('success', true);
END;
$$;
