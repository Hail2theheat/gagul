-- Set up telephone game for Test 1 group specifically

DO $$
DECLARE
  v_group_id UUID;
  v_result JSONB;
  v_member_count INTEGER;
BEGIN
  -- Find Test 1 group
  SELECT id INTO v_group_id
  FROM groups
  WHERE name ILIKE '%test%1%' OR name ILIKE 'test 1' OR name ILIKE 'test1'
  LIMIT 1;

  IF v_group_id IS NULL THEN
    -- List all groups for debugging
    RAISE NOTICE 'Test 1 group not found. Available groups:';
    FOR v_result IN SELECT jsonb_build_object('id', id, 'name', name) FROM groups LOOP
      RAISE NOTICE '%', v_result;
    END LOOP;
    RETURN;
  END IF;

  -- Check member count
  SELECT COUNT(*) INTO v_member_count
  FROM group_members
  WHERE group_id = v_group_id;

  RAISE NOTICE 'Found Test 1 group: % with % members', v_group_id, v_member_count;

  IF v_member_count < 2 THEN
    RAISE NOTICE 'Need at least 2 members. Adding current user if not already a member...';
  END IF;

  -- Set up telephone game
  v_result := setup_telephone_game(v_group_id);
  RAISE NOTICE 'Setup result: %', v_result;
END $$;
