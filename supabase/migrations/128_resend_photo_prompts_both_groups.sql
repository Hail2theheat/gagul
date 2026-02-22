-- Resend Procrastination Station, Fridge Find, and Valentine's Day photo prompts
-- to BOTH Thugz and Fambam groups. Clear broken responses (37-byte error files)
-- so users can re-submit with the fixed upload code.

-- Thugz:  5646f359-b44b-4f6c-bdc4-77d3f5ace015
-- Fambam: f1af309f-d041-483d-a176-c46d2346fb79

-- Prompt IDs:
-- Procrastination Station: 4a895e15-f09c-4d9c-bb1e-205c3756df9b
-- Fridge Find:             cbab746c-e2ec-488c-9965-c702ac87550d
-- Valentine's Day:         d71d5403-9c2a-476a-86b4-72008ff1c952

DO $$
DECLARE
  v_thugz_id UUID := '5646f359-b44b-4f6c-bdc4-77d3f5ace015';
  v_fambam_id UUID := 'f1af309f-d041-483d-a176-c46d2346fb79';
  v_procrastination_id UUID := '4a895e15-f09c-4d9c-bb1e-205c3756df9b';
  v_fridge_id UUID := 'cbab746c-e2ec-488c-9965-c702ac87550d';
  v_vday_id UUID := 'd71d5403-9c2a-476a-86b4-72008ff1c952';
  v_week DATE := '2026-02-09';
BEGIN
  -- ============================================================
  -- STEP 1: Clear broken responses for EXISTING group_prompts
  -- ============================================================

  -- Thugz: Procrastination (0432c66b) and Fridge Find (84ff1bf6)
  DELETE FROM response_log WHERE group_prompt_id IN (
    '0432c66b-170d-4e9a-9602-f9b493518149',
    '84ff1bf6-e3e1-46e9-97d8-77603a0aaa0d'
  );
  DELETE FROM responses WHERE group_prompt_id IN (
    '0432c66b-170d-4e9a-9602-f9b493518149',
    '84ff1bf6-e3e1-46e9-97d8-77603a0aaa0d'
  );
  DELETE FROM notification_log WHERE group_prompt_id IN (
    '0432c66b-170d-4e9a-9602-f9b493518149',
    '84ff1bf6-e3e1-46e9-97d8-77603a0aaa0d'
  );

  -- Fambam: Valentine's Day (2474fc04)
  DELETE FROM response_log WHERE group_prompt_id = '2474fc04-9ae3-4142-a911-8cf3e1445e46';
  DELETE FROM responses WHERE group_prompt_id = '2474fc04-9ae3-4142-a911-8cf3e1445e46';
  DELETE FROM notification_log WHERE group_prompt_id = '2474fc04-9ae3-4142-a911-8cf3e1445e46';

  -- ============================================================
  -- STEP 2: Reschedule existing group_prompts (now + 24h)
  -- ============================================================

  -- Thugz: Procrastination + Fridge Find
  UPDATE group_prompts
  SET scheduled_for = now(), expires_at = now() + interval '24 hours', is_active = true
  WHERE id IN (
    '0432c66b-170d-4e9a-9602-f9b493518149',
    '84ff1bf6-e3e1-46e9-97d8-77603a0aaa0d'
  );

  -- Fambam: Valentine's Day
  UPDATE group_prompts
  SET scheduled_for = now(), expires_at = now() + interval '24 hours', is_active = true
  WHERE id = '2474fc04-9ae3-4142-a911-8cf3e1445e46';

  -- ============================================================
  -- STEP 3: Create MISSING group_prompts
  -- ============================================================

  -- Thugz needs Valentine's Day
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (v_thugz_id, v_vday_id, now(), now() + interval '24 hours', v_week, true);

  -- Fambam needs Procrastination Station + Fridge Find
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (v_fambam_id, v_procrastination_id, now(), now() + interval '24 hours', v_week, true);

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (v_fambam_id, v_fridge_id, now(), now() + interval '24 hours', v_week, true);

  RAISE NOTICE 'Resent 3 photo prompts to Thugz and Fambam!';
END $$;
