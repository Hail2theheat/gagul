-- Week of Feb 9-15, 2026 Prompts
-- Mon: Photo (Procrastinating)
-- Tue: 2x Quiplash (Jazz inventor, Funeral slogan)
-- Wed: Short text (Bucket list)
-- Thu: Photo (Funny photo)
-- Fri: Short text (Olympics) + Quiplash voting
-- Sat: Photo (Valentine's Day)
-- Sun: Fireside 8pm EST

DO $$
DECLARE
  v_photo_mon_id UUID;
  v_quiplash1_id UUID;
  v_quiplash2_id UUID;
  v_short_wed_id UUID;
  v_photo_thu_id UUID;
  v_short_fri_id UUID;
  v_photo_sat_id UUID;
  v_week DATE := '2026-02-09';
BEGIN
  -- MONDAY Feb 9 - Photo: Procrastinating
  INSERT INTO prompts (type, content, title, category, is_active)
  VALUES ('photo', 'Take a pic of something you''re procrastinating on', 'Procrastination Station', 'silly', true)
  RETURNING id INTO v_photo_mon_id;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_photo_mon_id, '2026-02-09 20:00:00+00'::timestamptz, '2026-02-10 05:00:00+00'::timestamptz, v_week, true
  FROM groups g;

  -- TUESDAY Feb 10 - Two Quiplash prompts
  INSERT INTO prompts (type, content, title, category, is_active)
  VALUES ('quiplash', 'The name of the inventor of Jazz (make it up)', 'Jazz Inventor', 'silly', true)
  RETURNING id INTO v_quiplash1_id;

  INSERT INTO prompts (type, content, title, category, is_active)
  VALUES ('quiplash', 'A terrible slogan for a funeral home', 'Funeral Slogan', 'silly', true)
  RETURNING id INTO v_quiplash2_id;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_quiplash1_id, '2026-02-10 20:00:00+00'::timestamptz, '2026-02-11 05:00:00+00'::timestamptz, v_week, true
  FROM groups g;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_quiplash2_id, '2026-02-10 20:00:00+00'::timestamptz, '2026-02-11 05:00:00+00'::timestamptz, v_week, true
  FROM groups g;

  -- WEDNESDAY Feb 11 - Short text: Bucket list
  INSERT INTO prompts (type, content, title, category, is_active)
  VALUES ('short_text', 'Do you have a written bucket list? If yes, say one thing on it.', 'Bucket List', 'deep', true)
  RETURNING id INTO v_short_wed_id;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_short_wed_id, '2026-02-11 20:00:00+00'::timestamptz, '2026-02-12 05:00:00+00'::timestamptz, v_week, true
  FROM groups g;

  -- THURSDAY Feb 12 - Photo: Funny photo roll
  INSERT INTO prompts (type, content, title, category, is_active)
  VALUES ('photo', 'Go through your photo roll and send me the first picture that makes you laugh', 'Laugh Photo', 'silly', true)
  RETURNING id INTO v_photo_thu_id;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_photo_thu_id, '2026-02-12 20:00:00+00'::timestamptz, '2026-02-13 05:00:00+00'::timestamptz, v_week, true
  FROM groups g;

  -- FRIDAY Feb 13 - Short text: Olympics (+ Quiplash voting opens)
  INSERT INTO prompts (type, content, title, category, is_active)
  VALUES ('short_text', 'Coolest thing you have seen so far at the Olympics', 'Olympics Highlight', 'deep', true)
  RETURNING id INTO v_short_fri_id;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_short_fri_id, '2026-02-13 20:00:00+00'::timestamptz, '2026-02-14 05:00:00+00'::timestamptz, v_week, true
  FROM groups g;

  -- SATURDAY Feb 14 - Photo: Valentine's Day
  INSERT INTO prompts (type, content, title, category, is_active)
  VALUES ('photo', 'Send or upload a photo of how you celebrate Vday', 'Valentine''s Day', 'deep', true)
  RETURNING id INTO v_photo_sat_id;

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  SELECT g.id, v_photo_sat_id, '2026-02-14 20:00:00+00'::timestamptz, '2026-02-15 05:00:00+00'::timestamptz, v_week, true
  FROM groups g;

  RAISE NOTICE 'Week of Feb 9 prompts scheduled!';
END $$;
