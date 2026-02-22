-- Send photo prompt to "Test 1" group
DO $$
DECLARE
  v_group_id UUID;
  v_prompt_id UUID;
BEGIN
  -- Find "Test 1" group
  SELECT id INTO v_group_id FROM groups WHERE name = 'Test 1' LIMIT 1;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Group "Test 1" not found';
  END IF;

  -- Get the photo prompt we already created
  SELECT id INTO v_prompt_id FROM prompts
  WHERE content = 'Show us what you see right now! Snap a photo of whatever is in front of you.'
    AND type = 'photo'
  LIMIT 1;

  -- Deactivate other active prompts for this group
  UPDATE group_prompts SET is_active = false
  WHERE group_id = v_group_id AND is_active = true;

  -- Schedule the photo prompt as active now
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, is_active, week_of)
  VALUES (v_group_id, v_prompt_id, now(), now() + interval '24 hours', true, date_trunc('week', now())::date);
END $$;
