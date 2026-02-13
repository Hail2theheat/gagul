-- Allow single user to have multiple steps in a chain (for testing)
-- Drop the unique constraint that prevents this

ALTER TABLE telephone_steps DROP CONSTRAINT IF EXISTS telephone_steps_chain_id_user_id_key;

-- Clean up Test 1 and create single-user test chain
DO $$
DECLARE
  v_group_id UUID := 'a806c618-4c95-4bfa-9b73-9aaf377551af'; -- Test 1 group
  v_my_user_id UUID;
  v_chain_id UUID;
  v_prompt TEXT;
BEGIN
  -- Get a user from the group
  SELECT user_id INTO v_my_user_id
  FROM group_members
  WHERE group_id = v_group_id
  LIMIT 1;

  IF v_my_user_id IS NULL THEN
    RAISE NOTICE 'No users in Test 1 group';
    RETURN;
  END IF;

  -- Remove other members from Test 1 (keep only one)
  DELETE FROM group_members
  WHERE group_id = v_group_id
  AND user_id != v_my_user_id;

  -- Delete old telephone chains for Test 1
  DELETE FROM telephone_chains WHERE group_id = v_group_id;

  RAISE NOTICE 'Cleaned up Test 1 group. User: %', v_my_user_id;

  -- Get a random prompt
  SELECT content INTO v_prompt
  FROM telephone_prompts
  WHERE is_active = true
  ORDER BY random()
  LIMIT 1;

  -- Create the chain
  INSERT INTO telephone_chains (group_id, week_of, initial_prompt)
  VALUES (v_group_id, date_trunc('week', CURRENT_DATE)::DATE, v_prompt)
  RETURNING id INTO v_chain_id;

  -- Assign all 4 steps to the same user for testing
  INSERT INTO telephone_steps (chain_id, step_number, user_id, step_type) VALUES
    (v_chain_id, 1, v_my_user_id, 'draw'),
    (v_chain_id, 2, v_my_user_id, 'write'),
    (v_chain_id, 3, v_my_user_id, 'draw'),
    (v_chain_id, 4, v_my_user_id, 'write');

  RAISE NOTICE 'Created test chain with prompt: "%"', v_prompt;
END $$;
