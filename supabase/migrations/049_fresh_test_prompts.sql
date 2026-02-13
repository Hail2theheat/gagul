-- Clean slate: Remove all responses and group_prompts, then add fresh test prompts

-- Delete all responses
DELETE FROM responses;

-- Delete all group_prompts
DELETE FROM group_prompts;

-- Create test prompts if they don't exist
INSERT INTO prompts (id, type, content, title, category, options, is_active) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'short_text', 'What are you grateful for today?', 'Gratitude', 'deep', NULL, true),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'long_text', 'Tell us about a memorable moment from this week.', 'Weekly Memory', 'deep', NULL, true),
  ('aaaaaaaa-0003-0003-0003-000000000003', 'photo', 'Show us your current view!', 'Your View', 'silly', NULL, true),
  ('aaaaaaaa-0004-0004-0004-000000000004', 'multiple_choice', 'What''s your energy level right now?', 'Energy Check', 'interactive', '["☕ Need coffee", "😊 Feeling good", "🔥 On fire!", "😴 Ready for bed"]', true),
  ('aaaaaaaa-0005-0005-0005-000000000005', 'quiplash', 'What would be the worst thing to say at a job interview?', 'Interview Fails', 'silly', NULL, true)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  title = EXCLUDED.title,
  options = EXCLUDED.options;

-- Add prompts to ALL groups (one of each type)
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT g.id, 'aaaaaaaa-0001-0001-0001-000000000001', now() - interval '1 minute', now() + interval '48 hours', date_trunc('week', now())::date, true
FROM groups g;

INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT g.id, 'aaaaaaaa-0002-0002-0002-000000000002', now() - interval '1 minute', now() + interval '48 hours', date_trunc('week', now())::date, true
FROM groups g;

INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT g.id, 'aaaaaaaa-0003-0003-0003-000000000003', now() - interval '1 minute', now() + interval '48 hours', date_trunc('week', now())::date, true
FROM groups g;

INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT g.id, 'aaaaaaaa-0004-0004-0004-000000000004', now() - interval '1 minute', now() + interval '48 hours', date_trunc('week', now())::date, true
FROM groups g;

INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT g.id, 'aaaaaaaa-0005-0005-0005-000000000005', now() - interval '1 minute', now() + interval '48 hours', date_trunc('week', now())::date, true
FROM groups g;
