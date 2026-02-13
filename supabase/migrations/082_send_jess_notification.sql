-- Check push tokens table and find Jess

DO $$
DECLARE
  v_user_id UUID;
  v_token TEXT;
  v_username TEXT;
BEGIN
  -- Find Jess's user ID and token
  SELECT p.id, p.username, pt.token
  INTO v_user_id, v_username, v_token
  FROM profiles p
  LEFT JOIN push_tokens pt ON pt.user_id = p.id
  WHERE p.username ILIKE '%jess%'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Try by email
    SELECT u.id, p.username, pt.token
    INTO v_user_id, v_username, v_token
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN push_tokens pt ON pt.user_id = u.id
    WHERE u.email ILIKE '%jess%'
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Found user: % (%), token: %', v_username, v_user_id, COALESCE(v_token, 'NO TOKEN');
END $$;
