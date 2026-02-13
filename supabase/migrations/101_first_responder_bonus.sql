-- First Responder Bonus: +1 point for the first person to answer a prompt (except Sunday)

-- Replace the award_answer_points() trigger function to also check first responder
CREATE OR REPLACE FUNCTION award_answer_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
  v_week DATE;
  v_scheduled_for TIMESTAMPTZ;
  v_existing_count INTEGER;
BEGIN
  -- Get group_id, week, and scheduled_for from the group_prompt
  SELECT gp.group_id, gp.week_of, gp.scheduled_for
  INTO v_group_id, v_week, v_scheduled_for
  FROM group_prompts gp WHERE gp.id = NEW.group_prompt_id;

  IF v_group_id IS NOT NULL THEN
    -- Award standard answering points to weekly_points
    INSERT INTO weekly_points (group_id, user_id, week_of, points_answering)
    VALUES (v_group_id, NEW.user_id, COALESCE(v_week, date_trunc('week', now())::date), 10)
    ON CONFLICT (group_id, user_id, week_of)
    DO UPDATE SET
      points_answering = weekly_points.points_answering + 10,
      updated_at = now();

    -- Check if this is the first responder for this prompt
    SELECT COUNT(*) INTO v_existing_count
    FROM responses
    WHERE group_prompt_id = NEW.group_prompt_id
      AND id != NEW.id;

    -- Award first responder bonus if:
    -- 1. No other responses exist (this is the first)
    -- 2. The prompt is NOT scheduled on a Sunday (DOW 0 = Sunday)
    IF v_existing_count = 0 AND EXTRACT(DOW FROM v_scheduled_for) != 0 THEN
      PERFORM award_points(NEW.user_id, 'first_responder', 1, v_group_id, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
