-- Fix get_my_telephone - avoid accessing unassigned record fields

CREATE OR REPLACE FUNCTION get_my_telephone(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_step RECORD;
  v_prev_content TEXT := NULL;
  v_prev_drawing_url TEXT := NULL;
BEGIN
  v_week := date_trunc('week', CURRENT_DATE)::DATE;

  -- Find user's pending step for this week
  SELECT ts.*, tc.initial_prompt, tc.id as chain_id
  INTO v_step
  FROM telephone_steps ts
  JOIN telephone_chains tc ON tc.id = ts.chain_id
  WHERE tc.group_id = p_group_id
    AND tc.week_of = v_week
    AND ts.user_id = auth.uid()
    AND ts.submitted_at IS NULL
    AND (
      ts.step_number = 1
      OR EXISTS (
        SELECT 1 FROM telephone_steps prev
        WHERE prev.chain_id = ts.chain_id
          AND prev.step_number = ts.step_number - 1
          AND prev.submitted_at IS NOT NULL
      )
    )
  ORDER BY ts.step_number
  LIMIT 1;

  IF v_step IS NULL THEN
    RETURN jsonb_build_object('has_assignment', false);
  END IF;

  -- Get previous step data into separate variables (only if step > 1)
  IF v_step.step_number > 1 THEN
    SELECT content, drawing_url
    INTO v_prev_content, v_prev_drawing_url
    FROM telephone_steps
    WHERE chain_id = v_step.chain_id
      AND step_number = v_step.step_number - 1;
  END IF;

  -- Build and return result using the separate variables
  RETURN jsonb_build_object(
    'has_assignment', true,
    'step_id', v_step.id,
    'chain_id', v_step.chain_id,
    'step_number', v_step.step_number,
    'step_type', v_step.step_type,
    'initial_prompt', CASE WHEN v_step.step_number = 1 THEN v_step.initial_prompt ELSE NULL END,
    'previous_content', v_prev_content,
    'previous_drawing_url', v_prev_drawing_url
  );
END;
$$;
