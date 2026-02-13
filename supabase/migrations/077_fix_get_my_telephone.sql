-- Fix the get_my_telephone bug where v_previous_step is accessed before assignment

CREATE OR REPLACE FUNCTION get_my_telephone(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_step RECORD;
  v_previous_step RECORD;
  v_result JSONB;
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
    -- Only show if it's step 1 or previous step is done
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

  -- Get previous step's content - ONLY if step > 1
  IF v_step.step_number > 1 THEN
    SELECT * INTO v_previous_step
    FROM telephone_steps
    WHERE chain_id = v_step.chain_id
      AND step_number = v_step.step_number - 1;
  END IF;

  -- Build result with CASE to avoid accessing unassigned record
  v_result := jsonb_build_object(
    'has_assignment', true,
    'step_id', v_step.id,
    'chain_id', v_step.chain_id,
    'step_number', v_step.step_number,
    'step_type', v_step.step_type,
    'initial_prompt', CASE WHEN v_step.step_number = 1 THEN v_step.initial_prompt ELSE NULL END,
    'previous_content', CASE WHEN v_step.step_number > 1 THEN v_previous_step.content ELSE NULL END,
    'previous_drawing_url', CASE WHEN v_step.step_number > 1 THEN v_previous_step.drawing_url ELSE NULL END
  );

  RETURN v_result;
END;
$$;
