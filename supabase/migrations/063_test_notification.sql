-- Test notification prompt
DO $$
DECLARE
  v_prompt_id UUID;
  v_group RECORD;
BEGIN
  -- Create the test prompt
  INSERT INTO prompts (type, title, content, is_active)
  VALUES ('short_text', 'Yoooo Test notification. Text Stephen if you see this', 'Test notification - ignore this prompt', true)
  RETURNING id INTO v_prompt_id;

  -- Create group_prompts for ALL groups, starting NOW
  FOR v_group IN SELECT id FROM groups LOOP
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (
      v_group.id,
      v_prompt_id,
      now(),  -- Start immediately
      now() + interval '10 minutes',  -- Expire in 10 mins (short test)
      date_trunc('week', now())::date,
      true
    );
  END LOOP;

  RAISE NOTICE 'Created test prompt: %', v_prompt_id;
END $$;
