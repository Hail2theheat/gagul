-- =====================================================
-- PROMPT SCHEDULING SYSTEM
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Add category column to prompts for rotation
-- Categories: text, text_silly, multiple_choice, photo, quiplash
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'text';

-- 2. Add is_most_likely flag for "Most Likely To..." prompts
-- These will dynamically use group members as options
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS is_most_likely BOOLEAN DEFAULT false;

-- 3. Create table to track category rotation per group
CREATE TABLE IF NOT EXISTS group_schedule_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  last_category TEXT DEFAULT 'quiplash',
  last_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id)
);

-- Enable RLS
ALTER TABLE group_schedule_state ENABLE ROW LEVEL SECURITY;

-- Allow read for group members
CREATE POLICY "Members can view schedule state" ON group_schedule_state
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_schedule_state.group_id AND gm.user_id = auth.uid())
  );

-- 4. Function to get next category in rotation
CREATE OR REPLACE FUNCTION get_next_category(current_category TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  -- Rotation order: text → text_silly → multiple_choice → photo → quiplash → text
  RETURN CASE current_category
    WHEN 'text' THEN 'text_silly'
    WHEN 'text_silly' THEN 'multiple_choice'
    WHEN 'multiple_choice' THEN 'photo'
    WHEN 'photo' THEN 'quiplash'
    WHEN 'quiplash' THEN 'text'
    ELSE 'text'
  END;
END;
$$;

-- 5. Function to schedule daily prompt for a group
CREATE OR REPLACE FUNCTION schedule_daily_prompt(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_state RECORD;
  v_next_category TEXT;
  v_prompt RECORD;
  v_scheduled_time TIMESTAMPTZ;
  v_expires_at TIMESTAMPTZ;
  v_today DATE;
  v_random_hour INTEGER;
  v_random_minute INTEGER;
BEGIN
  -- Get today's date in EST
  v_today := (NOW() AT TIME ZONE 'America/New_York')::DATE;

  -- Check if already scheduled for today
  IF EXISTS (
    SELECT 1 FROM group_prompts
    WHERE group_id = p_group_id
    AND (scheduled_for AT TIME ZONE 'America/New_York')::DATE = v_today
    AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Already scheduled for today');
  END IF;

  -- Get or create schedule state
  INSERT INTO group_schedule_state (group_id, last_category)
  VALUES (p_group_id, 'quiplash')
  ON CONFLICT (group_id) DO NOTHING;

  SELECT * INTO v_state FROM group_schedule_state WHERE group_id = p_group_id;

  -- Get next category
  v_next_category := get_next_category(v_state.last_category);

  -- Pick a random prompt from that category
  SELECT * INTO v_prompt
  FROM prompts
  WHERE category = v_next_category
    AND is_active = true
  ORDER BY times_used ASC, RANDOM()
  LIMIT 1;

  IF v_prompt.id IS NULL THEN
    -- No prompts in this category, try any category
    SELECT * INTO v_prompt
    FROM prompts
    WHERE is_active = true
    ORDER BY times_used ASC, RANDOM()
    LIMIT 1;

    IF v_prompt.id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'No prompts available');
    END IF;
  END IF;

  -- Calculate random time between 9 AM and 7 PM EST
  v_random_hour := 9 + floor(random() * 10)::INTEGER; -- 9-18 (9 AM - 6 PM)
  v_random_minute := floor(random() * 60)::INTEGER;

  v_scheduled_time := (v_today || ' ' || v_random_hour || ':' || v_random_minute || ':00')::TIMESTAMP
                      AT TIME ZONE 'America/New_York';

  -- Expires at midnight EST
  v_expires_at := ((v_today + INTERVAL '1 day') || ' 00:00:00')::TIMESTAMP
                  AT TIME ZONE 'America/New_York';

  -- Create the group_prompt
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (p_group_id, v_prompt.id, v_scheduled_time, v_expires_at, date_trunc('week', v_today)::DATE, true);

  -- Update schedule state
  UPDATE group_schedule_state
  SET last_category = v_next_category, last_scheduled_at = NOW()
  WHERE group_id = p_group_id;

  -- Increment times_used
  UPDATE prompts SET times_used = times_used + 1 WHERE id = v_prompt.id;

  RETURN jsonb_build_object(
    'success', true,
    'prompt_id', v_prompt.id,
    'category', v_next_category,
    'scheduled_for', v_scheduled_time,
    'expires_at', v_expires_at
  );
END;
$$;

-- 6. Function to schedule prompts for ALL active groups
CREATE OR REPLACE FUNCTION schedule_all_groups()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group RECORD;
  v_results JSONB := '[]'::JSONB;
  v_result JSONB;
BEGIN
  FOR v_group IN
    SELECT DISTINCT g.id
    FROM groups g
    INNER JOIN group_members gm ON gm.group_id = g.id
  LOOP
    v_result := schedule_daily_prompt(v_group.id);
    v_results := v_results || jsonb_build_object('group_id', v_group.id, 'result', v_result);
  END LOOP;

  RETURN v_results;
END;
$$;

-- 7. Function to get group members with avatars (for "Most Likely To..." prompts)
CREATE OR REPLACE FUNCTION get_group_members_with_avatars(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', p.id,
        'username', p.username,
        'avatar_config', p.avatar_config
      )
    )
    FROM profiles p
    INNER JOIN group_members gm ON gm.user_id = p.id
    WHERE gm.group_id = p_group_id
  );
END;
$$;

-- 8. Update get_group_status to include is_most_likely flag
CREATE OR REPLACE FUNCTION get_group_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_active RECORD;
  v_response RECORD;
  v_rating RECORD;
  v_members JSONB;
BEGIN
  -- Get active prompt for this group
  SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer,
         p.category, p.payload, p.is_most_likely
  INTO v_active
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id
    AND gp.scheduled_for <= now()
    AND gp.expires_at > now()
    AND gp.is_active = true
  ORDER BY gp.scheduled_for DESC
  LIMIT 1;

  -- Check if user has responded
  IF v_active.id IS NOT NULL THEN
    SELECT * INTO v_response FROM responses
    WHERE group_prompt_id = v_active.id AND user_id = auth.uid();

    SELECT * INTO v_rating FROM prompt_ratings
    WHERE prompt_id = v_active.pid AND user_id = auth.uid();

    -- Get members if this is a "most likely" prompt
    IF v_active.is_most_likely THEN
      v_members := get_group_members_with_avatars(p_group_id);
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'active_prompt_instance', CASE WHEN v_active.id IS NOT NULL AND v_response.id IS NULL THEN jsonb_build_object(
      'id', v_active.id,
      'prompt_id', v_active.pid,
      'scheduled_for', v_active.scheduled_for,
      'expires_at', v_active.expires_at,
      'week_of', v_active.week_of,
      'prompts', jsonb_build_object(
        'id', v_active.pid,
        'type', v_active.type,
        'content', v_active.content,
        'title', v_active.title,
        'options', v_active.options,
        'correct_answer', v_active.correct_answer,
        'category', v_active.category,
        'payload', v_active.payload,
        'is_most_likely', v_active.is_most_likely
      ),
      'group_members', v_members
    ) ELSE NULL END,
    'active_expires_at', v_active.expires_at,
    'has_responded', v_response.id IS NOT NULL,
    'has_rated', v_rating.id IS NOT NULL,
    'user_rating', v_rating.rating
  );

  RETURN v_result;
END;
$$;

-- 9. Seed some example prompts with categories
-- (You can delete these and add your own CSV later)

-- Text (informational) prompts
INSERT INTO prompts (type, content, title, category, is_active) VALUES
  ('short_text', 'What''s one thing you''re grateful for today?', 'Gratitude', 'text', true),
  ('short_text', 'What''s your comfort food?', 'Comfort Food', 'text', true),
  ('short_text', 'What''s a skill you''d love to learn?', 'Dream Skill', 'text', true)
ON CONFLICT DO NOTHING;

-- Text (silly) prompts
INSERT INTO prompts (type, content, title, category, is_active) VALUES
  ('short_text', 'Finish this sentence: My hidden talent is...', 'Hidden Talent', 'text_silly', true),
  ('short_text', 'If you were a pizza topping, what would you be and why?', 'Pizza Identity', 'text_silly', true),
  ('short_text', 'What would your rapper name be?', 'Rapper Name', 'text_silly', true)
ON CONFLICT DO NOTHING;

-- Photo prompts
INSERT INTO prompts (type, content, title, category, is_active) VALUES
  ('photo', 'Show us your view right now', 'Current View', 'photo', true),
  ('photo', 'Share a photo that made you smile recently', 'Smile Photo', 'photo', true),
  ('photo', 'What''s on your desk/table right now?', 'Desk Check', 'photo', true)
ON CONFLICT DO NOTHING;

-- Multiple choice prompts (regular)
INSERT INTO prompts (type, content, title, category, options, is_active) VALUES
  ('multiple_choice', 'What''s your ideal weekend?', 'Weekend Vibes', 'multiple_choice', '["Adventure outdoors", "Cozy at home", "Socializing with friends", "Catching up on sleep"]', true),
  ('multiple_choice', 'Pick your superpower:', 'Superpower', 'multiple_choice', '["Flight", "Invisibility", "Time travel", "Read minds"]', true)
ON CONFLICT DO NOTHING;

-- "Most Likely To..." prompts (uses group members)
INSERT INTO prompts (type, content, title, category, is_most_likely, is_active) VALUES
  ('multiple_choice', 'Who is most likely to survive a zombie apocalypse?', 'Zombie Survivor', 'multiple_choice', true, true),
  ('multiple_choice', 'Who is most likely to become famous?', 'Future Famous', 'multiple_choice', true, true),
  ('multiple_choice', 'Who is most likely to show up late?', 'Late Arrival', 'multiple_choice', true, true),
  ('multiple_choice', 'Who would win in a dance-off?', 'Dance Champ', 'multiple_choice', true, true)
ON CONFLICT DO NOTHING;

-- Quiplash prompts
INSERT INTO prompts (type, content, title, category, is_active) VALUES
  ('quiplash', 'The worst thing to say on a first date', 'First Date Fail', 'quiplash', true),
  ('quiplash', 'A terrible name for a restaurant', 'Bad Restaurant', 'quiplash', true),
  ('quiplash', 'What''s really in hot dogs?', 'Hot Dog Mystery', 'quiplash', true)
ON CONFLICT DO NOTHING;

-- Done! Now you can:
-- 1. Call schedule_all_groups() to schedule today's prompts
-- 2. Set up a cron to call it daily (see Edge Function)
