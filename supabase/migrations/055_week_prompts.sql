-- Prompts for the rest of the week leading up to Sunday Fireside

DO $$
DECLARE
  v_quiplash1_id UUID;
  v_quiplash2_id UUID;
  v_short_text_id UUID;
  v_mc_id UUID;
BEGIN
  -- ============================================
  -- THURSDAY (Feb 5) - Two Quiplash prompts
  -- ============================================

  -- Quiplash 1: Worst thing to come out of a pinata
  SELECT id INTO v_quiplash1_id FROM prompts WHERE title = 'Pinata Surprise' AND type = 'quiplash' LIMIT 1;
  IF v_quiplash1_id IS NULL THEN
    INSERT INTO prompts (type, content, title, category, is_active, is_nsfw, is_user_generated)
    VALUES (
      'quiplash',
      'Worst thing to come out of a pinata',
      'Pinata Surprise',
      'silly',
      true, false, false
    )
    RETURNING id INTO v_quiplash1_id;
  END IF;

  -- Quiplash 2: The name of the person who invented Jazz
  SELECT id INTO v_quiplash2_id FROM prompts WHERE title = 'Jazz Inventor' AND type = 'quiplash' LIMIT 1;
  IF v_quiplash2_id IS NULL THEN
    INSERT INTO prompts (type, content, title, category, is_active, is_nsfw, is_user_generated)
    VALUES (
      'quiplash',
      'The name of the person who invented Jazz',
      'Jazz Inventor',
      'silly',
      true, false, false
    )
    RETURNING id INTO v_quiplash2_id;
  END IF;

  -- Schedule Thursday quiplash prompts for all groups
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_quiplash1_id, '2026-02-05 00:00:00+00'::timestamptz, '2026-02-06 00:00:00+00'::timestamptz, '2026-02-02'::date, true
  FROM groups g
  WHERE NOT EXISTS (SELECT 1 FROM group_prompts gp WHERE gp.group_id = g.id AND gp.prompt_id = v_quiplash1_id);

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_quiplash2_id, '2026-02-05 00:00:00+00'::timestamptz, '2026-02-06 00:00:00+00'::timestamptz, '2026-02-02'::date, true
  FROM groups g
  WHERE NOT EXISTS (SELECT 1 FROM group_prompts gp WHERE gp.group_id = g.id AND gp.prompt_id = v_quiplash2_id);

  -- ============================================
  -- FRIDAY (Feb 6) - Short text + Quiplash voting opens automatically
  -- ============================================

  SELECT id INTO v_short_text_id FROM prompts WHERE title = 'Secret Skill' AND type = 'short_text' LIMIT 1;
  IF v_short_text_id IS NULL THEN
    INSERT INTO prompts (type, content, title, category, is_active, is_nsfw, is_user_generated)
    VALUES (
      'short_text',
      'Name a secret skill you have that people are usually surprised about',
      'Secret Skill',
      'deep',
      true, false, false
    )
    RETURNING id INTO v_short_text_id;
  END IF;

  -- Schedule Friday short text for all groups
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_short_text_id, '2026-02-06 00:00:00+00'::timestamptz, '2026-02-07 00:00:00+00'::timestamptz, '2026-02-02'::date, true
  FROM groups g
  WHERE NOT EXISTS (SELECT 1 FROM group_prompts gp WHERE gp.group_id = g.id AND gp.prompt_id = v_short_text_id);

  -- ============================================
  -- SATURDAY (Feb 7) - Multiple Choice elimination
  -- ============================================

  SELECT id INTO v_mc_id FROM prompts WHERE title = 'Eliminate One Forever' AND type = 'multiple_choice' LIMIT 1;
  IF v_mc_id IS NULL THEN
    INSERT INTO prompts (type, content, title, category, options, is_active, is_nsfw, is_user_generated)
    VALUES (
      'multiple_choice',
      'You must eliminate one forever. Choose wisely.',
      'Eliminate One Forever',
      'interactive',
      '["All screens - think about this one", "HVAC - hello climate", "Shoes and adjacent foot coverings - Full Hobbit", "Toilets of all forms - good luck"]'::jsonb,
      true, false, false
    )
    RETURNING id INTO v_mc_id;
  END IF;

  -- Schedule Saturday MC for all groups
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_mc_id, '2026-02-07 00:00:00+00'::timestamptz, '2026-02-08 00:00:00+00'::timestamptz, '2026-02-02'::date, true
  FROM groups g
  WHERE NOT EXISTS (SELECT 1 FROM group_prompts gp WHERE gp.group_id = g.id AND gp.prompt_id = v_mc_id);

END $$;
