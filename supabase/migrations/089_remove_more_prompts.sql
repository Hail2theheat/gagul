-- Remove Energy Check and test notification prompts

DO $$
DECLARE
  v_group_id UUID;
  v_week DATE := '2026-02-02';
BEGIN
  SELECT id INTO v_group_id FROM groups WHERE name ILIKE '%wirthlin%' LIMIT 1;

  -- Delete responses first
  DELETE FROM responses
  WHERE group_prompt_id IN (
    SELECT gp.id
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = v_group_id
      AND gp.week_of = v_week
      AND (
        p.title ILIKE '%Energy Check%'
        OR p.content ILIKE '%energy level%'
        OR p.title ILIKE '%test notification%'
        OR p.content ILIKE '%test notification%'
      )
  );

  -- Delete the group_prompts
  DELETE FROM group_prompts
  WHERE group_id = v_group_id
    AND week_of = v_week
    AND prompt_id IN (
      SELECT id FROM prompts
      WHERE title ILIKE '%Energy Check%'
        OR content ILIKE '%energy level%'
        OR title ILIKE '%test notification%'
        OR content ILIKE '%test notification%'
    );

  RAISE NOTICE 'Removed Energy Check and test prompts';
END $$;
