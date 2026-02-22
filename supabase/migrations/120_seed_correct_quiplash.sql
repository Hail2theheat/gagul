-- Seed quiplash data for ALL quiplash group_prompts (not just first 3)
DO $$
DECLARE
  v_gp RECORD;
  v_users UUID[];
  v_matchup_id UUID;
  v_response_a_id UUID;
  v_response_b_id UUID;
  v_prompt_idx INT := 0;
  v_answer_a TEXT;
  v_answer_b TEXT;
BEGIN
  -- Get up to 4 user IDs from profiles
  SELECT array_agg(id) INTO v_users
  FROM (SELECT id FROM profiles ORDER BY created_at LIMIT 4) sub;

  IF v_users IS NULL OR array_length(v_users, 1) < 2 THEN
    RAISE EXCEPTION 'Need at least 2 profiles';
  END IF;

  -- Process ALL quiplash group_prompts that don't already have assignments
  FOR v_gp IN
    SELECT gp.id as group_prompt_id, p.content, p.title, gp.group_id
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE p.type = 'quiplash'
      AND NOT EXISTS (
        SELECT 1 FROM quiplash_assignments qa WHERE qa.group_prompt_id = gp.id
      )
    ORDER BY gp.scheduled_for
  LOOP
    v_prompt_idx := v_prompt_idx + 1;

    -- Pick fun answers based on prompt content
    IF v_gp.content ILIKE '%pilot%' THEN
      v_answer_a := 'Okay Google, how do you land a plane?';
      v_answer_b := 'First time flying one of these bad boys!';
    ELSIF v_gp.content ILIKE '%funeral%' THEN
      v_answer_a := 'We put the FUN in funeral!';
      v_answer_b := 'You kill em, we chill em';
    ELSIF v_gp.content ILIKE '%superlative%' OR v_gp.content ILIKE '%most likely%' THEN
      v_answer_a := 'become a supervillain';
      v_answer_b := 'accidentally start a cult';
    ELSIF v_gp.content ILIKE '%interview%' THEN
      v_answer_a := 'So when do I start... the hostile takeover?';
      v_answer_b := 'I brought my emotional support sword';
    ELSIF v_gp.content ILIKE '%pinata%' THEN
      v_answer_a := 'A strongly worded letter from the HOA';
      v_answer_b := 'Another smaller pinata (its pinatas all the way down)';
    ELSE
      v_answer_a := 'Answer A for: ' || COALESCE(v_gp.content, v_gp.title);
      v_answer_b := 'Answer B for: ' || COALESCE(v_gp.content, v_gp.title);
    END IF;

    RAISE NOTICE 'Seeding: % (group %)', COALESCE(v_gp.content, v_gp.title), v_gp.group_id;

    v_matchup_id := gen_random_uuid();

    -- Assignments
    INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
    VALUES (v_gp.group_prompt_id, v_users[1], v_matchup_id)
    ON CONFLICT (group_prompt_id, user_id) DO NOTHING;

    INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
    VALUES (v_gp.group_prompt_id, v_users[2], v_matchup_id)
    ON CONFLICT (group_prompt_id, user_id) DO NOTHING;

    -- Response A
    INSERT INTO responses (id, user_id, group_prompt_id, content, submitted_at)
    VALUES (gen_random_uuid(), v_users[1], v_gp.group_prompt_id,
            to_jsonb(v_answer_a), now() - interval '2 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_response_a_id;

    IF v_response_a_id IS NULL THEN
      SELECT id INTO v_response_a_id FROM responses
      WHERE user_id = v_users[1] AND group_prompt_id = v_gp.group_prompt_id LIMIT 1;
    END IF;

    -- Response B
    INSERT INTO responses (id, user_id, group_prompt_id, content, submitted_at)
    VALUES (gen_random_uuid(), v_users[2], v_gp.group_prompt_id,
            to_jsonb(v_answer_b), now() - interval '2 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_response_b_id;

    IF v_response_b_id IS NULL THEN
      SELECT id INTO v_response_b_id FROM responses
      WHERE user_id = v_users[2] AND group_prompt_id = v_gp.group_prompt_id LIMIT 1;
    END IF;

    RAISE NOTICE 'Responses: A=%, B=%', v_response_a_id, v_response_b_id;

    -- Votes
    IF v_response_a_id IS NOT NULL AND v_response_b_id IS NOT NULL THEN
      INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
      VALUES (v_matchup_id, v_users[1], v_response_b_id)
      ON CONFLICT (matchup_id, voter_id) DO NOTHING;

      INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
      VALUES (v_matchup_id, v_users[2], v_response_a_id)
      ON CONFLICT (matchup_id, voter_id) DO NOTHING;

      IF array_length(v_users, 1) >= 3 THEN
        INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
        VALUES (v_matchup_id, v_users[3], v_response_a_id)
        ON CONFLICT (matchup_id, voter_id) DO NOTHING;
      END IF;

      IF array_length(v_users, 1) >= 4 THEN
        -- Alternate: odd prompts = A wins big, even = tie
        IF v_prompt_idx % 2 = 1 THEN
          INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
          VALUES (v_matchup_id, v_users[4], v_response_a_id)
          ON CONFLICT (matchup_id, voter_id) DO NOTHING;
        ELSE
          INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
          VALUES (v_matchup_id, v_users[4], v_response_b_id)
          ON CONFLICT (matchup_id, voter_id) DO NOTHING;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE 'Done. Seeded % quiplash prompts', v_prompt_idx;
END $$;
