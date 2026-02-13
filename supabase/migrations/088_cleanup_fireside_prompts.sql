-- Remove specific prompts from Fireside

DO $$
DECLARE
  v_group_id UUID;
  v_week DATE := '2026-02-02';
  r RECORD;
BEGIN
  -- Get Wirthlin family group
  SELECT id INTO v_group_id FROM groups WHERE name ILIKE '%wirthlin%' LIMIT 1;

  -- Show what prompts exist
  RAISE NOTICE '--- Current prompts ---';
  FOR r IN
    SELECT gp.id, gp.scheduled_for, p.content, p.title
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = v_group_id AND gp.week_of = v_week
    ORDER BY gp.scheduled_for
  LOOP
    RAISE NOTICE '%: % - %', r.scheduled_for, r.title, LEFT(r.content, 50);
  END LOOP;

  -- Delete responses for unwanted prompts first
  DELETE FROM responses
  WHERE group_prompt_id IN (
    SELECT gp.id
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = v_group_id
      AND gp.week_of = v_week
      AND (
        p.content ILIKE '%current energy%'
        OR p.content ILIKE '%grateful%'
        OR p.content ILIKE '%memorable moment%'
        OR p.title ILIKE '%current energy%'
        OR p.title ILIKE '%grateful%'
        OR p.title ILIKE '%memorable moment%'
      )
  );

  -- Delete the group_prompts
  DELETE FROM group_prompts
  WHERE group_id = v_group_id
    AND week_of = v_week
    AND prompt_id IN (
      SELECT id FROM prompts
      WHERE content ILIKE '%current energy%'
        OR content ILIKE '%grateful%'
        OR content ILIKE '%memorable moment%'
        OR title ILIKE '%current energy%'
        OR title ILIKE '%grateful%'
        OR title ILIKE '%memorable moment%'
    );

  RAISE NOTICE '--- Remaining prompts ---';
  FOR r IN
    SELECT gp.id, gp.scheduled_for, p.content, p.title
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = v_group_id AND gp.week_of = v_week
    ORDER BY gp.scheduled_for
  LOOP
    RAISE NOTICE '%: % - %', r.scheduled_for, r.title, LEFT(r.content, 50);
  END LOOP;
END $$;
