-- Debug why Fireside has no data

DO $$
DECLARE
  v_current_week DATE;
  v_group_id UUID;
  v_prompt_count INTEGER;
  v_response_count INTEGER;
BEGIN
  -- Get current week start
  v_current_week := date_trunc('week', CURRENT_DATE)::DATE;
  RAISE NOTICE 'Current week_of: %', v_current_week;

  -- Find Wirthlin family group
  SELECT id INTO v_group_id FROM groups WHERE name ILIKE '%wirthlin%' LIMIT 1;
  RAISE NOTICE 'Group ID: %', v_group_id;

  -- Count prompts for this week
  SELECT COUNT(*) INTO v_prompt_count
  FROM group_prompts
  WHERE group_id = v_group_id AND week_of = v_current_week;
  RAISE NOTICE 'Prompts for current week: %', v_prompt_count;

  -- Count prompts for ALL weeks
  RAISE NOTICE '--- All prompts by week ---';
  FOR v_current_week IN
    SELECT DISTINCT week_of FROM group_prompts WHERE group_id = v_group_id ORDER BY week_of DESC LIMIT 5
  LOOP
    SELECT COUNT(*) INTO v_prompt_count FROM group_prompts WHERE group_id = v_group_id AND week_of = v_current_week;
    SELECT COUNT(*) INTO v_response_count
    FROM responses r
    JOIN group_prompts gp ON gp.id = r.group_prompt_id
    WHERE gp.group_id = v_group_id AND gp.week_of = v_current_week;
    RAISE NOTICE 'Week %: % prompts, % responses', v_current_week, v_prompt_count, v_response_count;
  END LOOP;

  -- Show actual dates
  RAISE NOTICE '--- Recent group_prompts ---';
  FOR v_current_week IN
    SELECT DISTINCT scheduled_for::date FROM group_prompts WHERE group_id = v_group_id ORDER BY scheduled_for DESC LIMIT 5
  LOOP
    RAISE NOTICE 'Prompt date: %', v_current_week;
  END LOOP;
END $$;
