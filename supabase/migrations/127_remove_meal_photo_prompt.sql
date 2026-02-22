-- Remove the "show us what you're eating" meal photo prompt
-- Deactivate group_prompts so it stops showing, then deactivate the prompt itself
DO $$
DECLARE
  v_prompt_id UUID;
BEGIN
  SELECT id INTO v_prompt_id FROM prompts WHERE title = 'Meal Photo' AND type = 'photo' LIMIT 1;

  IF v_prompt_id IS NOT NULL THEN
    -- Remove all scheduled instances from groups
    DELETE FROM group_prompts WHERE prompt_id = v_prompt_id;

    -- Deactivate the prompt
    UPDATE prompts SET is_active = false WHERE id = v_prompt_id;
  END IF;
END $$;
