-- Add video prompt and schedule it NOW
INSERT INTO prompts (id, type, content, title, category, is_active)
VALUES (
  'c5555555-5555-5555-5555-555555555555',
  'video',
  'Record a 10-second video of your surroundings right now!',
  'Quick Video',
  'test',
  true
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  type = EXCLUDED.type;

-- Schedule for all groups NOW
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
