-- Assign users to today's quiplash prompts
-- The week_of for this week's prompts is '2026-02-02'

DO $$
DECLARE
  v_group RECORD;
  v_result JSONB;
BEGIN
  FOR v_group IN SELECT id, name FROM groups LOOP
    SELECT assign_quiplash_across_prompts(v_group.id, '2026-02-02'::date) INTO v_result;
    RAISE NOTICE 'Assigned quiplash for %: %', v_group.name, v_result;
  END LOOP;
END $$;
