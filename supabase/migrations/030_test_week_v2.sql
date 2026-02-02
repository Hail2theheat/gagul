-- =====================================================
-- TEST WEEK V2: February 9-15, 2026
-- Custom prompts for friend group test
-- =====================================================

-- First, clear the old test week schedule
DELETE FROM group_prompts WHERE week_of = '2026-02-09';

-- Delete old test prompts
DELETE FROM prompts WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333',
  'a4444444-4444-4444-4444-444444444444',
  'a5555555-5555-5555-5555-555555555555',
  'a6666666-6666-6666-6666-666666666666',
  'a7777777-7777-7777-7777-777777777777'
);

-- =====================================================
-- CREATE NEW PROMPTS
-- =====================================================

INSERT INTO prompts (id, type, content, title, category, options, is_active) VALUES

  -- MONDAY: Quiplash 1 - Pilot
  ('b1111111-1111-1111-1111-111111111111', 'quiplash',
   'Worst thing to overhear a pilot say',
   'Pilot Panic', 'quiplash', NULL, true),

  -- MONDAY: Quiplash 2 - Superlative
  ('b1111111-1111-1111-1111-222222222222', 'quiplash',
   'Worst High School superlative: Most likely to __________',
   'Worst Superlative', 'quiplash', NULL, true),

  -- TUESDAY: Photo - Useless thing
  ('b2222222-2222-2222-2222-222222222222', 'photo',
   'Show me the most useless thing you own.',
   'Useless Possession', 'photo', NULL, true),

  -- WEDNESDAY: TED Talk
  ('b3333333-3333-3333-3333-333333333333', 'long_text',
   'If you were forced to give a 30 minute TED talk right now, what would be your subject? What could you actually talk about for the full 30 minutes?',
   'Impromptu TED Talk', 'text', NULL, true),

  -- THURSDAY: Pitbull Would You Rather
  ('b4444444-4444-4444-4444-444444444444', 'multiple_choice',
   'Would you rather...',
   'Pitbull Dilemma', 'multiple_choice',
   '["All songs exist but they are ALL performed by Pitbull", "Only ONE Pitbull song exists but it''s performed by every artist with their own cover interpretation"]'::jsonb, true),

  -- FRIDAY: Hill to die on
  ('b5555555-5555-5555-5555-555555555555', 'short_text',
   'What hill will you die on?',
   'Die On This Hill', 'text', NULL, true),

  -- SATURDAY: Chuckle photo
  ('b6666666-6666-6666-6666-666666666666', 'photo',
   'Scroll through your photos and send me the first one that makes you chuckle out loud.',
   'Chuckle Photo', 'photo', NULL, true)

ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  options = EXCLUDED.options;

-- =====================================================
-- SCHEDULE FOR ALL GROUPS
-- =====================================================

DO $$
DECLARE
  v_group RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_group IN SELECT id, name FROM groups LOOP

    -- MONDAY Feb 9 - 10 AM EST: Quiplash 1 (Pilot)
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'b1111111-1111-1111-1111-111111111111',
            '2026-02-09 10:00:00-05', '2026-02-10 00:00:00-05', '2026-02-09', true);

    -- MONDAY Feb 9 - 10:05 AM EST: Quiplash 2 (Superlative) - 5 min later so both show
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'b1111111-1111-1111-1111-222222222222',
            '2026-02-09 10:05:00-05', '2026-02-10 00:00:00-05', '2026-02-09', true);

    -- TUESDAY Feb 10 - 11 AM EST: Photo (Useless thing)
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'b2222222-2222-2222-2222-222222222222',
            '2026-02-10 11:00:00-05', '2026-02-11 00:00:00-05', '2026-02-09', true);

    -- WEDNESDAY Feb 11 - 2 PM EST: TED Talk
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'b3333333-3333-3333-3333-333333333333',
            '2026-02-11 14:00:00-05', '2026-02-12 00:00:00-05', '2026-02-09', true);

    -- THURSDAY Feb 12 - 10 AM EST: Pitbull MC
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'b4444444-4444-4444-4444-444444444444',
            '2026-02-12 10:00:00-05', '2026-02-13 00:00:00-05', '2026-02-09', true);

    -- FRIDAY Feb 13 - 12 PM EST: Hill to die on
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'b5555555-5555-5555-5555-555555555555',
            '2026-02-13 12:00:00-05', '2026-02-14 00:00:00-05', '2026-02-09', true);

    -- SATURDAY Feb 14 - 9 AM EST: Chuckle photo
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'b6666666-6666-6666-6666-666666666666',
            '2026-02-14 09:00:00-05', '2026-02-15 00:00:00-05', '2026-02-09', true);

    v_count := v_count + 1;
    RAISE NOTICE 'Scheduled week for group: % (%)', v_group.name, v_group.id;
  END LOOP;

  RAISE NOTICE 'DONE! Scheduled prompts for % groups', v_count;
END $$;

-- =====================================================
-- VERIFY
-- =====================================================
SELECT
  g.name as group_name,
  TO_CHAR(gp.scheduled_for AT TIME ZONE 'America/New_York', 'Dy Mon DD HH:MI AM') as goes_live,
  p.type,
  p.title,
  LEFT(p.content, 40) as prompt_preview
FROM group_prompts gp
JOIN groups g ON g.id = gp.group_id
JOIN prompts p ON p.id = gp.prompt_id
WHERE gp.week_of = '2026-02-09'
ORDER BY g.name, gp.scheduled_for;
