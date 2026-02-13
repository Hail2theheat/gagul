-- Force add active prompts to ALL groups
-- This migration runs fresh queries to ensure prompts are active

-- Deactivate all existing group_prompts first
UPDATE group_prompts SET is_active = false;

-- Delete any responses to test prompts so we can test fresh
DELETE FROM responses WHERE group_prompt_id IN (
  SELECT id FROM group_prompts WHERE prompt_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  )
);

-- Delete any existing test group_prompts
DELETE FROM group_prompts WHERE prompt_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- Insert fresh prompts for ALL groups
INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  g.id,
  '11111111-1111-1111-1111-111111111111',
  now() - interval '1 minute',  -- Started 1 minute ago
  now() + interval '48 hours',   -- Expires in 48 hours
  date_trunc('week', now())::date,
  true
FROM groups g;

INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
SELECT
  g.id,
  '22222222-2222-2222-2222-222222222222',
  now() - interval '1 minute',
  now() + interval '48 hours',
  date_trunc('week', now())::date,
  true
FROM groups g;
