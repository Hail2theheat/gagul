-- Fix the schedule_daily_prompt function with correct timestamp handling

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

  -- Build scheduled time properly
  v_scheduled_time := (v_today + (v_random_hour || ' hours')::INTERVAL + (v_random_minute || ' minutes')::INTERVAL)
                      AT TIME ZONE 'America/New_York';

  -- Expires at midnight EST next day
  v_expires_at := (v_today + INTERVAL '1 day') AT TIME ZONE 'America/New_York';

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
