-- First, update any prompts with non-standard types to 'short_text'
UPDATE prompts SET type = 'short_text' WHERE type NOT IN ('short_text', 'long_text', 'photo', 'multiple_choice', 'quiz', 'quiplash');

-- Now we can safely update the constraint to include voice and video
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_type_check;

ALTER TABLE prompts ADD CONSTRAINT prompts_type_check
  CHECK (type IN ('short_text', 'long_text', 'photo', 'multiple_choice', 'quiz', 'quiplash', 'voice', 'video'));

-- Create test prompts (photo, MC, text for now - voice/video components ready but skipping for this test)
INSERT INTO prompts (id, type, content, title, category, options, is_active) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'photo',
   'Show me your current view right now!',
   'Your View', 'test', NULL, true),

  ('c2222222-2222-2222-2222-222222222222', 'multiple_choice',
   'What is the best pizza topping?',
   'Pizza Debate', 'test',
   '["Pepperoni", "Mushrooms", "Pineapple", "Extra Cheese"]'::jsonb, true),

  ('c3333333-3333-3333-3333-333333333333', 'short_text',
   'Describe your mood in exactly 3 words.',
   'Three Word Mood', 'test', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  options = EXCLUDED.options;

-- Schedule them NOW for all groups (expire in 2 hours)
DO $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN SELECT id, name FROM groups LOOP
    -- Photo prompt
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'c1111111-1111-1111-1111-111111111111',
            now(), now() + interval '2 hours', CURRENT_DATE, true)
    ON CONFLICT DO NOTHING;

    -- MC prompt
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'c2222222-2222-2222-2222-222222222222',
            now(), now() + interval '2 hours', CURRENT_DATE, true)
    ON CONFLICT DO NOTHING;

    -- Text prompt
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (v_group.id, 'c3333333-3333-3333-3333-333333333333',
            now(), now() + interval '2 hours', CURRENT_DATE, true)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Added 3 test prompts for group: %', v_group.name;
  END LOOP;
END $$;
