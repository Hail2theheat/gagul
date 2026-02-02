-- =====================================================
-- TEST WEEK SCHEDULE: February 9-15, 2026
-- This will schedule prompts for ALL your groups
-- =====================================================

-- STEP 1: Create the test prompts
INSERT INTO prompts (id, type, content, title, category, options, is_active) VALUES
  -- Monday - Easy icebreaker (short text)
  ('a1111111-1111-1111-1111-111111111111', 'short_text',
   'In 3 words, describe your current mood.',
   'Monday Mood', 'text', NULL, true),

  -- Tuesday - Fun photo
  ('a2222222-2222-2222-2222-222222222222', 'photo',
   'Show us your lunch today!',
   'Lunch Check', 'photo', NULL, true),

  -- Wednesday - Multiple choice
  ('a3333333-3333-3333-3333-333333333333', 'multiple_choice',
   'What are you most looking forward to this week?',
   'Week Vibes', 'multiple_choice',
   '["Weekend plans", "A good meal", "Seeing friends", "Just relaxing"]'::jsonb, true),

  -- Thursday - Silly text
  ('a4444444-4444-4444-4444-444444444444', 'short_text',
   'If you were a snack, what snack would you be and why?',
   'Snack Identity', 'text_silly', NULL, true),

  -- Friday - Quiplash
  ('a5555555-5555-5555-5555-555555555555', 'quiplash',
   'The worst excuse for being late to work',
   'Late Excuse', 'quiplash', NULL, true),

  -- Saturday - Deeper question (long text)
  ('a6666666-6666-6666-6666-666666666666', 'long_text',
   'What''s something you''ve changed your mind about recently?',
   'Changed Mind', 'text', NULL, true),

  -- Sunday - Multiple choice before fireside
  ('a7777777-7777-7777-7777-777777777777', 'multiple_choice',
   'Pick your ideal lazy Sunday activity:',
   'Sunday Vibes', 'multiple_choice',
   '["Binge watching shows", "Sleeping in", "Brunch with friends", "Getting outdoors"]'::jsonb, true)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  options = EXCLUDED.options;

-- STEP 2: Schedule these prompts for ALL groups
-- This loops through every group and schedules the week
DO $$
DECLARE
  v_group RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_group IN SELECT id, name FROM groups LOOP
    -- Clear any existing test week schedules for this group
    DELETE FROM group_prompts
    WHERE group_id = v_group.id
      AND week_of = '2026-02-09';

    -- Monday Feb 9 - 10 AM EST
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'a1111111-1111-1111-1111-111111111111',
            '2026-02-09 10:00:00-05', '2026-02-10 00:00:00-05', '2026-02-09', true);

    -- Tuesday Feb 10 - 12 PM EST
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'a2222222-2222-2222-2222-222222222222',
            '2026-02-10 12:00:00-05', '2026-02-11 00:00:00-05', '2026-02-09', true);

    -- Wednesday Feb 11 - 2 PM EST
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'a3333333-3333-3333-3333-333333333333',
            '2026-02-11 14:00:00-05', '2026-02-12 00:00:00-05', '2026-02-09', true);

    -- Thursday Feb 12 - 11 AM EST
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'a4444444-4444-4444-4444-444444444444',
            '2026-02-12 11:00:00-05', '2026-02-13 00:00:00-05', '2026-02-09', true);

    -- Friday Feb 13 - 3 PM EST (Quiplash!)
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'a5555555-5555-5555-5555-555555555555',
            '2026-02-13 15:00:00-05', '2026-02-14 00:00:00-05', '2026-02-09', true);

    -- Saturday Feb 14 - 10 AM EST
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'a6666666-6666-6666-6666-666666666666',
            '2026-02-14 10:00:00-05', '2026-02-15 00:00:00-05', '2026-02-09', true);

    -- Sunday Feb 15 - 12 PM EST (before 9 PM fireside)
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'a7777777-7777-7777-7777-777777777777',
            '2026-02-15 12:00:00-05', '2026-02-16 00:00:00-05', '2026-02-09', true);

    v_count := v_count + 1;
    RAISE NOTICE 'Scheduled 7 prompts for group: % (%)', v_group.name, v_group.id;
  END LOOP;

  RAISE NOTICE 'DONE! Scheduled prompts for % groups', v_count;
END $$;

-- STEP 3: Verify the schedule
SELECT
  g.name as group_name,
  gp.scheduled_for AT TIME ZONE 'America/New_York' as goes_live_est,
  p.type,
  p.title,
  LEFT(p.content, 50) as prompt_preview
FROM group_prompts gp
JOIN groups g ON g.id = gp.group_id
JOIN prompts p ON p.id = gp.prompt_id
WHERE gp.week_of = '2026-02-09'
ORDER BY g.name, gp.scheduled_for;
