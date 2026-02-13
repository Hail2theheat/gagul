-- Remove everyone except Stevo from Test 1 group

DO $$
DECLARE
  v_group_id UUID := 'a806c618-4c95-4bfa-9b73-9aaf377551af'; -- Test 1 group
  v_stevo_id UUID;
  v_removed INTEGER;
BEGIN
  -- Find Stevo's user ID
  SELECT id INTO v_stevo_id
  FROM profiles
  WHERE username ILIKE '%stevo%'
  LIMIT 1;

  IF v_stevo_id IS NULL THEN
    RAISE NOTICE 'Could not find Stevo';
    RETURN;
  END IF;

  -- Remove everyone else from Test 1
  DELETE FROM group_members
  WHERE group_id = v_group_id
  AND user_id != v_stevo_id;

  GET DIAGNOSTICS v_removed = ROW_COUNT;

  RAISE NOTICE 'Removed % members from Test 1. Only Stevo remains.', v_removed;
END $$;
