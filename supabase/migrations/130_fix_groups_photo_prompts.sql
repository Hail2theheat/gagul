-- Fix: deactivate Fambam prompts (sent by mistake), set up Wirthlin Family + Test 1 instead
--
-- Fambam (f1af309f) - DEACTIVATE these:
--   3a7a3346 (Procrastination), 4a429f37 (Fridge), 2474fc04 (Vday)
--
-- Wirthlin Family (0e466a89):
--   Procrastination: 06f9f71f-0a3f-4865-9002-f11a3ac84b32
--   Valentine's Day: 9a868e22-eb20-4f8f-9c12-d07c2536fc0b
--   Fridge Find:     NEEDS CREATING
--
-- Test 1 (a806c618):
--   Valentine's Day: 6502d545-fe85-4ad3-b864-1adb3b58c854
--   Procrastination: NEEDS CREATING
--   Fridge Find:     NEEDS CREATING

DO $$
DECLARE
  v_wirthlin UUID := '0e466a89-d8a8-4c3d-a2d3-93e6ff5b6fcf';
  v_test1 UUID := 'a806c618-4c95-4bfa-9b73-9aaf377551af';
  v_procrastination_id UUID := '4a895e15-f09c-4d9c-bb1e-205c3756df9b';
  v_fridge_id UUID := 'cbab746c-e2ec-488c-9965-c702ac87550d';
  v_vday_id UUID := 'd71d5403-9c2a-476a-86b4-72008ff1c952';
  v_week DATE := '2026-02-09';

  -- Existing group_prompt IDs
  v_fambam_gps UUID[] := ARRAY[
    '3a7a3346-b332-4322-8f14-01415b2de3ea',
    '4a429f37-d558-4a40-829c-20ebabe0a058',
    '2474fc04-9ae3-4142-a911-8cf3e1445e46'
  ];
  v_wirthlin_existing UUID[] := ARRAY[
    '06f9f71f-0a3f-4865-9002-f11a3ac84b32',
    '9a868e22-eb20-4f8f-9c12-d07c2536fc0b'
  ];
  v_test1_existing UUID[] := ARRAY[
    '6502d545-fe85-4ad3-b864-1adb3b58c854'
  ];
BEGIN
  -- ============================================================
  -- STEP 1: Deactivate Fambam prompts (sent by mistake)
  -- ============================================================
  UPDATE group_prompts SET is_active = false WHERE id = ANY(v_fambam_gps);

  -- ============================================================
  -- STEP 2: Clear existing responses for Wirthlin + Test 1
  -- ============================================================
  DELETE FROM response_log WHERE group_prompt_id = ANY(v_wirthlin_existing || v_test1_existing);
  DELETE FROM prompt_views WHERE group_prompt_id = ANY(v_wirthlin_existing || v_test1_existing);
  DELETE FROM responses WHERE group_prompt_id = ANY(v_wirthlin_existing || v_test1_existing);
  DELETE FROM notification_log WHERE group_prompt_id = ANY(v_wirthlin_existing || v_test1_existing);

  -- Reschedule existing ones
  UPDATE group_prompts
  SET scheduled_for = now(), expires_at = now() + interval '24 hours', is_active = true
  WHERE id = ANY(v_wirthlin_existing || v_test1_existing);

  -- ============================================================
  -- STEP 3: Create missing group_prompts
  -- ============================================================

  -- Wirthlin Family needs Fridge Find
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (v_wirthlin, v_fridge_id, now(), now() + interval '24 hours', v_week, true);

  -- Test 1 needs Procrastination + Fridge Find
  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (v_test1, v_procrastination_id, now(), now() + interval '24 hours', v_week, true);

  INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
  VALUES (v_test1, v_fridge_id, now(), now() + interval '24 hours', v_week, true);

  RAISE NOTICE 'Deactivated Fambam. Sent 3 photo prompts to Wirthlin Family + Test 1!';
END $$;
