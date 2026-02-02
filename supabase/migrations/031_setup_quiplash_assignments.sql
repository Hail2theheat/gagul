-- =====================================================
-- SETUP QUIPLASH ASSIGNMENTS FOR TEST WEEK
-- This assigns users in each group to the two Monday quiplash prompts
-- Pair 1 gets "Pilot" prompt, Pair 2 gets "Superlative" prompt
-- =====================================================

-- Function to manually assign quiplash for specific prompts
CREATE OR REPLACE FUNCTION assign_quiplash_for_group_prompt(p_group_prompt_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
  v_members UUID[];
  v_matchup_id UUID;
  v_assigned INT := 0;
  v_i INT;
BEGIN
  -- Get the group_id for this group_prompt
  SELECT group_id INTO v_group_id FROM group_prompts WHERE id = p_group_prompt_id;

  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Group prompt not found');
  END IF;

  -- Check if assignments already exist
  IF EXISTS (SELECT 1 FROM quiplash_assignments WHERE group_prompt_id = p_group_prompt_id) THEN
    RETURN jsonb_build_object('message', 'Assignments already exist');
  END IF;

  -- Get all members, ordered randomly
  SELECT array_agg(user_id ORDER BY random()) INTO v_members
  FROM group_members WHERE group_id = v_group_id;

  IF array_length(v_members, 1) IS NULL OR array_length(v_members, 1) < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 members');
  END IF;

  -- Create one matchup for this prompt (pair the first 2 members)
  v_matchup_id := gen_random_uuid();
  v_i := 1;

  -- Assign first 2 members to this matchup
  WHILE v_i <= LEAST(2, array_length(v_members, 1)) LOOP
    INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
    VALUES (p_group_prompt_id, v_members[v_i], v_matchup_id);
    v_assigned := v_assigned + 1;
    v_i := v_i + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'assigned', v_assigned);
END;
$$;

-- Assign quiplash for the test week's Monday prompts
DO $$
DECLARE
  v_gp RECORD;
  v_result JSONB;
BEGIN
  -- For each group's Monday quiplash prompts
  FOR v_gp IN (
    SELECT gp.id, gp.group_id, g.name as group_name, p.title
    FROM group_prompts gp
    JOIN groups g ON g.id = gp.group_id
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE p.type = 'quiplash'
      AND gp.week_of = '2026-02-09'
    ORDER BY gp.group_id, gp.scheduled_for
  ) LOOP
    -- Assign users to this quiplash prompt
    SELECT assign_quiplash_for_group_prompt(v_gp.id) INTO v_result;
    RAISE NOTICE 'Assigned quiplash for group % prompt %: %', v_gp.group_name, v_gp.title, v_result;
  END LOOP;
END $$;

-- Better function: Assign ALL members across MULTIPLE quiplash prompts
-- This properly distributes 4 members across 2 prompts (2 per prompt)
CREATE OR REPLACE FUNCTION assign_quiplash_across_prompts(p_group_id UUID, p_week DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_members UUID[];
  v_member_count INT;
  v_prompts UUID[];
  v_prompt_count INT;
  v_matchup_id UUID;
  v_i INT := 1;
  v_j INT := 1;
  v_assigned INT := 0;
BEGIN
  -- Get all members
  SELECT array_agg(user_id ORDER BY random()) INTO v_members
  FROM group_members WHERE group_id = p_group_id;

  v_member_count := COALESCE(array_length(v_members, 1), 0);
  IF v_member_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 members');
  END IF;

  -- Get all quiplash prompts for this week
  SELECT array_agg(gp.id ORDER BY gp.scheduled_for) INTO v_prompts
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id
    AND gp.week_of = p_week
    AND p.type = 'quiplash';

  v_prompt_count := COALESCE(array_length(v_prompts, 1), 0);
  IF v_prompt_count = 0 THEN
    RETURN jsonb_build_object('error', 'No quiplash prompts found');
  END IF;

  -- Clear existing assignments for these prompts
  DELETE FROM quiplash_assignments WHERE group_prompt_id = ANY(v_prompts);

  -- Distribute members across prompts
  -- If 4 members and 2 prompts: members 1,2 -> prompt 1, members 3,4 -> prompt 2
  WHILE v_i <= v_member_count LOOP
    v_matchup_id := gen_random_uuid();

    -- Assign to current prompt
    INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
    VALUES (v_prompts[v_j], v_members[v_i], v_matchup_id);
    v_assigned := v_assigned + 1;
    v_i := v_i + 1;

    -- Assign second member of pair if exists
    IF v_i <= v_member_count THEN
      INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
      VALUES (v_prompts[v_j], v_members[v_i], v_matchup_id);
      v_assigned := v_assigned + 1;
      v_i := v_i + 1;
    END IF;

    -- Move to next prompt (cycle if needed)
    v_j := v_j + 1;
    IF v_j > v_prompt_count THEN
      v_j := 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'assigned', v_assigned, 'prompts_used', v_prompt_count);
END;
$$;

-- Re-assign using the better function
DO $$
DECLARE
  v_group RECORD;
  v_result JSONB;
BEGIN
  FOR v_group IN SELECT id, name FROM groups LOOP
    SELECT assign_quiplash_across_prompts(v_group.id, '2026-02-09') INTO v_result;
    RAISE NOTICE 'Assigned quiplash for %: %', v_group.name, v_result;
  END LOOP;
END $$;

-- Verify assignments
SELECT
  g.name as group_name,
  p.title as prompt_title,
  qa.matchup_id,
  pr.username,
  qa.user_id
FROM quiplash_assignments qa
JOIN group_prompts gp ON gp.id = qa.group_prompt_id
JOIN prompts p ON p.id = gp.prompt_id
JOIN groups g ON g.id = gp.group_id
LEFT JOIN profiles pr ON pr.id = qa.user_id
WHERE gp.week_of = '2026-02-09'
ORDER BY g.name, p.title, qa.matchup_id;
