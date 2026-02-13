-- List all users with push tokens
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.username, pt.token
    FROM profiles p
    JOIN push_tokens pt ON pt.user_id = p.id
    WHERE pt.token IS NOT NULL AND pt.token != ''
  LOOP
    RAISE NOTICE 'USER: % TOKEN: %', r.username, r.token;
  END LOOP;
END $$;
