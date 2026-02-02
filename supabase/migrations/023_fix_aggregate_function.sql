-- =====================================================
-- FIX: Aggregate functions not allowed in UPDATE
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================

-- Rewrite submit_prompt_rating to avoid subquery aggregates in UPDATE
CREATE OR REPLACE FUNCTION submit_prompt_rating(p_prompt_id UUID, p_rating BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_thumbs_up INTEGER;
  v_thumbs_down INTEGER;
BEGIN
  -- Insert or update the rating
  INSERT INTO prompt_ratings (prompt_id, user_id, rating)
  VALUES (p_prompt_id, auth.uid(), p_rating)
  ON CONFLICT (prompt_id, user_id) DO UPDATE SET rating = p_rating;

  -- Calculate counts separately (not in UPDATE subquery)
  SELECT COUNT(*) INTO v_thumbs_up
  FROM prompt_ratings
  WHERE prompt_id = p_prompt_id AND rating = true;

  SELECT COUNT(*) INTO v_thumbs_down
  FROM prompt_ratings
  WHERE prompt_id = p_prompt_id AND rating = false;

  -- Update with the calculated values
  UPDATE prompts SET
    thumbs_up = v_thumbs_up,
    thumbs_down = v_thumbs_down
  WHERE id = p_prompt_id;
END;
$$;

-- Also fix submit_response if it has similar issues
-- Check if submit_response function exists and fix if needed
CREATE OR REPLACE FUNCTION submit_response(
  p_group_prompt_id UUID,
  p_content TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_selected_option TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_response_id UUID;
  v_prompt_id UUID;
  v_group_id UUID;
  v_week_of DATE;
BEGIN
  -- Get prompt and group info
  SELECT gp.prompt_id, gp.group_id, gp.week_of
  INTO v_prompt_id, v_group_id, v_week_of
  FROM group_prompts gp
  WHERE gp.id = p_group_prompt_id;

  IF v_prompt_id IS NULL THEN
    RAISE EXCEPTION 'Group prompt not found';
  END IF;

  -- Insert response
  INSERT INTO responses (group_prompt_id, user_id, content, media_url, selected_option, submitted_at)
  VALUES (p_group_prompt_id, auth.uid(), p_content, p_media_url, p_selected_option, now())
  RETURNING id INTO v_response_id;

  -- Award points for answering (if weekly_points table exists)
  INSERT INTO weekly_points (user_id, group_id, week_of, points_answering)
  VALUES (auth.uid(), v_group_id, v_week_of, 10)
  ON CONFLICT (user_id, group_id, week_of)
  DO UPDATE SET points_answering = weekly_points.points_answering + 10;

  -- Increment times_used on the prompt
  UPDATE prompts SET times_used = COALESCE(times_used, 0) + 1 WHERE id = v_prompt_id;

  RETURN v_response_id;
END;
$$;
