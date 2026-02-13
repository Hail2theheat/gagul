-- Add voice prompt and schedule it NOW
INSERT INTO prompts (id, type, content, title, category, is_active)
VALUES (
  'c6666666-6666-6666-6666-666666666666',
  'voice',
  'Record a voice message telling us about the best part of your day!',
  'Voice Check-in',
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
    VALUES (v_group.id, 'c6666666-6666-6666-6666-666666666666',
            now(), now() + interval '3 hours', CURRENT_DATE, true);
    RAISE NOTICE 'Added voice prompt for: %', v_group.name;
  END LOOP;
END $$;
