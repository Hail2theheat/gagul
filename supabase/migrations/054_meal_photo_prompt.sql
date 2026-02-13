-- Create a meal photo prompt for tomorrow (Feb 4th)
DO $$
DECLARE
  v_prompt_id UUID;
BEGIN
  -- Check if prompt already exists by title
  SELECT id INTO v_prompt_id FROM prompts WHERE title = 'Meal Photo' AND type = 'photo' LIMIT 1;

  -- Create if not exists
  IF v_prompt_id IS NULL THEN
    INSERT INTO prompts (type, content, title, category, is_active, is_nsfw, is_user_generated)
    VALUES (
      'photo',
      'Share a photo of one of your meals today! Breakfast, lunch, dinner, or snack - show us what you''re eating.',
      'Meal Photo',
      'silly',
      true,
      false,
      false
    )
    RETURNING id INTO v_prompt_id;
  END IF;

  -- Schedule it for tomorrow (Feb 4th) for ALL groups that don't have it yet
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT
    g.id,
    v_prompt_id,
    '2026-02-04 00:00:00+00'::timestamptz,
    '2026-02-05 00:00:00+00'::timestamptz,
    '2026-02-02'::date,
    true
  FROM groups g
  WHERE NOT EXISTS (
    SELECT 1 FROM group_prompts gp
    WHERE gp.group_id = g.id
    AND gp.prompt_id = v_prompt_id
  );
END $$;
