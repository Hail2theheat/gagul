-- Clean slate: delete ALL responses for 3 photo prompts in both Thugz and Fambam,
-- then reschedule them fresh (now + 24h).
--
-- Thugz (5646f359):
--   Procrastination: 0432c66b-170d-4e9a-9602-f9b493518149
--   Fridge Find:     84ff1bf6-e3e1-46e9-97d8-77603a0aaa0d
--   Valentine's Day: 6601db3c-abed-4366-b508-2936020ca206
--
-- Fambam (f1af309f):
--   Procrastination: 3a7a3346-b332-4322-8f14-01415b2de3ea
--   Fridge Find:     4a429f37-d558-4a40-829c-20ebabe0a058
--   Valentine's Day: 2474fc04-9ae3-4142-a911-8cf3e1445e46

DO $$
DECLARE
  v_gp_ids UUID[] := ARRAY[
    '0432c66b-170d-4e9a-9602-f9b493518149',
    '84ff1bf6-e3e1-46e9-97d8-77603a0aaa0d',
    '6601db3c-abed-4366-b508-2936020ca206',
    '3a7a3346-b332-4322-8f14-01415b2de3ea',
    '4a429f37-d558-4a40-829c-20ebabe0a058',
    '2474fc04-9ae3-4142-a911-8cf3e1445e46'
  ];
BEGIN
  -- 1. Delete response_log entries
  DELETE FROM response_log WHERE group_prompt_id = ANY(v_gp_ids);

  -- 2. Delete prompt_views
  DELETE FROM prompt_views WHERE group_prompt_id = ANY(v_gp_ids);

  -- 3. Delete all responses (clears photos)
  DELETE FROM responses WHERE group_prompt_id = ANY(v_gp_ids);

  -- 4. Delete notification_log so notifications re-send
  DELETE FROM notification_log WHERE group_prompt_id = ANY(v_gp_ids);

  -- 5. Reschedule all 6 group_prompts: active now, expires in 24h
  UPDATE group_prompts
  SET scheduled_for = now(),
      expires_at = now() + interval '24 hours',
      is_active = true
  WHERE id = ANY(v_gp_ids);

  RAISE NOTICE 'Cleared all responses and rescheduled 3 photo prompts for Thugz + Fambam';
END $$;
