-- Send another video prompt to test the fixed sizing
DO $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN SELECT id, name FROM groups LOOP
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'c5555555-5555-5555-5555-555555555555',
            now(), now() + interval '3 hours', CURRENT_DATE, true);
    RAISE NOTICE 'Added video prompt for: %', v_group.name;
  END LOOP;
END $$;
