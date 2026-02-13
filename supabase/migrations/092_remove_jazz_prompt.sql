-- Remove the "who invented jazz" prompt from Fireside

DO $$
DECLARE
  v_group_id UUID;
  v_week DATE := '2026-02-02';
BEGIN
  -- Get Wirthlin family group
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
        p.content ILIKE '%invented jazz%'
        OR p.content ILIKE '%who invented jazz%'
        OR p.title ILIKE '%jazz%'
      )
  );

  -- Delete the group_prompts
  DELETE FROM group_prompts
  WHERE group_id = v_group_id
    AND week_of = v_week
    AND prompt_id IN (
      SELECT id FROM prompts
      WHERE content ILIKE '%invented jazz%'
        OR content ILIKE '%who invented jazz%'
        OR title ILIKE '%jazz%'
    );

  RAISE NOTICE 'Removed jazz prompt';
END $$;
