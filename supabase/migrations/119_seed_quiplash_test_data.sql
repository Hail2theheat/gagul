-- Seed quiplash test data using profiles (not limited to group members)
DO $$
DECLARE
  v_gp RECORD;
  v_users UUID[];
  v_matchup_id UUID;
  v_response_a_id UUID;
  v_response_b_id UUID;
  v_answers TEXT[][] := ARRAY[
    ARRAY['Okay Google, how do you land a plane?', 'First time flying one of these bad boys!'],
    ARRAY['We put the FUN in funeral!', 'You kill em, we chill em'],
    ARRAY['Siri, what does this button do?', 'Good news: the WiFi works. Bad news: everything else']
  ];
  v_prompt_idx INT := 0;
BEGIN
  -- Get up to 4 user IDs from profiles
  SELECT array_agg(id) INTO v_users
  FROM (SELECT id FROM profiles ORDER BY created_at LIMIT 4) sub;

  IF v_users IS NULL OR array_length(v_users, 1) < 2 THEN
    RAISE EXCEPTION 'Need at least 2 profiles, found %', COALESCE(array_length(v_users, 1), 0);
  END IF;

  RAISE NOTICE 'Using % users from profiles', array_length(v_users, 1);

  -- Process ALL quiplash group_prompts across all groups
  FOR v_gp IN
    SELECT gp.id as group_prompt_id, p.content, p.title
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE p.type = 'quiplash'
    ORDER BY gp.scheduled_for
  LOOP
    v_prompt_idx := v_prompt_idx + 1;
    IF v_prompt_idx > 3 THEN EXIT; END IF;

    RAISE NOTICE 'Seeding quiplash: %', COALESCE(v_gp.content, v_gp.title);

    v_matchup_id := gen_random_uuid();

    -- Create assignments for first 2 users
    INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
    VALUES (v_gp.group_prompt_id, v_users[1], v_matchup_id)
    ON CONFLICT (group_prompt_id, user_id) DO NOTHING;

    INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
    VALUES (v_gp.group_prompt_id, v_users[2], v_matchup_id)
    ON CONFLICT (group_prompt_id, user_id) DO NOTHING;

    -- Create response A (from user 1)
    INSERT INTO responses (id, user_id, group_prompt_id, content, submitted_at)
    VALUES (gen_random_uuid(), v_users[1], v_gp.group_prompt_id,
            to_jsonb(v_answers[v_prompt_idx][1]), now() - interval '2 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_response_a_id;

    IF v_response_a_id IS NULL THEN
      SELECT id INTO v_response_a_id FROM responses
      WHERE user_id = v_users[1] AND group_prompt_id = v_gp.group_prompt_id LIMIT 1;
    END IF;

    -- Create response B (from user 2)
    INSERT INTO responses (id, user_id, group_prompt_id, content, submitted_at)
    VALUES (gen_random_uuid(), v_users[2], v_gp.group_prompt_id,
            to_jsonb(v_answers[v_prompt_idx][2]), now() - interval '2 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_response_b_id;

    IF v_response_b_id IS NULL THEN
      SELECT id INTO v_response_b_id FROM responses
      WHERE user_id = v_users[2] AND group_prompt_id = v_gp.group_prompt_id LIMIT 1;
    END IF;

    RAISE NOTICE 'Response A: %, Response B: %', v_response_a_id, v_response_b_id;

    IF v_response_a_id IS NOT NULL AND v_response_b_id IS NOT NULL THEN
      -- User 1 votes for response B
      INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
      VALUES (v_matchup_id, v_users[1], v_response_b_id)
      ON CONFLICT (matchup_id, voter_id) DO NOTHING;

      -- User 2 votes for response A
      INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
      VALUES (v_matchup_id, v_users[2], v_response_a_id)
      ON CONFLICT (matchup_id, voter_id) DO NOTHING;

      -- User 3 votes for A (A wins 2-1)
      IF array_length(v_users, 1) >= 3 THEN
        INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
        VALUES (v_matchup_id, v_users[3], v_response_a_id)
        ON CONFLICT (matchup_id, voter_id) DO NOTHING;
      END IF;

      -- User 4 varies: tie on prompt 1, A wins on others
      IF array_length(v_users, 1) >= 4 THEN
        IF v_prompt_idx = 1 THEN
          INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
          VALUES (v_matchup_id, v_users[4], v_response_b_id)
          ON CONFLICT (matchup_id, voter_id) DO NOTHING;
        ELSE
          INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
          VALUES (v_matchup_id, v_users[4], v_response_a_id)
          ON CONFLICT (matchup_id, voter_id) DO NOTHING;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Seeded % quiplash prompts with test data', v_prompt_idx;
END $$;
