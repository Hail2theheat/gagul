-- Extend expiry on existing test prompts and ensure all are active
UPDATE group_prompts
SET expires_at = now() + interval '3 hours',
    is_active = true
WHERE prompt_id IN (
  'c1111111-1111-1111-1111-111111111111',
  'c2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333'
);

-- Add any missing prompts for groups
DO $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN SELECT id, name FROM groups LOOP
    -- MC prompt if not exists
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    SELECT v_group.id, 'c2222222-2222-2222-2222-222222222222', now(), now() + interval '3 hours', CURRENT_DATE, true
    WHERE NOT EXISTS (
      SELECT 1 FROM group_prompts
      WHERE group_id = v_group.id AND prompt_id = 'c2222222-2222-2222-2222-222222222222'
    );

    -- Text prompt if not exists
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    SELECT v_group.id, 'c3333333-3333-3333-3333-333333333333', now(), now() + interval '3 hours', CURRENT_DATE, true
    WHERE NOT EXISTS (
      SELECT 1 FROM group_prompts
      WHERE group_id = v_group.id AND prompt_id = 'c3333333-3333-3333-3333-333333333333'
    );

    RAISE NOTICE 'Ensured prompts for: %', v_group.name;
  END LOOP;
END $$;
