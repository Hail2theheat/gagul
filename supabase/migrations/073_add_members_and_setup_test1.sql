-- Add members to Test 1 group and set up telephone game

DO $$
DECLARE
  v_group_id UUID := 'a806c618-4c95-4bfa-9b73-9aaf377551af'; -- Test 1 group
  v_user RECORD;
  v_result JSONB;
  v_count INTEGER := 0;
BEGIN
  -- Add users from Wirthlin family to Test 1 (for testing purposes)
  FOR v_user IN
    SELECT gm.user_id
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE g.name ILIKE '%wirthlin%'
    LIMIT 3
  LOOP
    -- Add to Test 1 if not already a member
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (v_group_id, v_user.user_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Added % users to Test 1 group', v_count;

  -- Now set up telephone game
  v_result := setup_telephone_game(v_group_id);
  RAISE NOTICE 'Telephone setup result: %', v_result;
END $$;
