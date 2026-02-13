-- Recreate Test 1 group and set up telephone for single-user testing

DO $$
DECLARE
  v_group_id UUID;
  v_user_id UUID;
  v_chain_id UUID;
  v_prompt TEXT;
BEGIN
  -- Get your user ID (the main user)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email ILIKE '%stephenbitner%' OR email ILIKE '%steph%'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Fallback: get any user
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  END IF;

  RAISE NOTICE 'Using user: %', v_user_id;

  -- Check if Test 1 exists
  SELECT id INTO v_group_id FROM groups WHERE name = 'Test 1';

  IF v_group_id IS NULL THEN
    -- Create Test 1 group
    INSERT INTO groups (name, code)
    VALUES ('Test 1', 'TEST01')
    RETURNING id INTO v_group_id;
    RAISE NOTICE 'Created Test 1 group: %', v_group_id;
  ELSE
    RAISE NOTICE 'Test 1 group exists: %', v_group_id;
  END IF;

  -- Make sure user is a member
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'admin')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- Clean up any old telephone data
  DELETE FROM telephone_chains WHERE group_id = v_group_id;

  -- Get a random prompt
  SELECT content INTO v_prompt
  FROM telephone_prompts
  WHERE is_active = true
  ORDER BY random()
  LIMIT 1;

  -- Create telephone chain
  INSERT INTO telephone_chains (group_id, week_of, initial_prompt)
  VALUES (v_group_id, date_trunc('week', CURRENT_DATE)::DATE, v_prompt)
  RETURNING id INTO v_chain_id;

  -- Assign all 4 steps to the user
  INSERT INTO telephone_steps (chain_id, step_number, user_id, step_type) VALUES
    (v_chain_id, 1, v_user_id, 'draw'),
    (v_chain_id, 2, v_user_id, 'write'),
    (v_chain_id, 3, v_user_id, 'draw'),
    (v_chain_id, 4, v_user_id, 'write');

  RAISE NOTICE 'Set up telephone with prompt: "%"', v_prompt;
  RAISE NOTICE 'Group ID: %', v_group_id;
END $$;
