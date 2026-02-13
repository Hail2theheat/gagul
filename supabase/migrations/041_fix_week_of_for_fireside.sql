-- Fix week_of for all test prompts so they show in Fireside
-- The fireside uses date_trunc('week', now()) which is the Monday of the current week

-- Update all group_prompts to use the correct week_of (Monday of current week)
UPDATE group_prompts
SET week_of = date_trunc('week', now())::date
WHERE week_of >= CURRENT_DATE - INTERVAL '7 days';

-- Verify the data
DO $$
DECLARE
  v_count INTEGER;
  v_week DATE;
BEGIN
  v_week := date_trunc('week', now())::date;
  SELECT COUNT(*) INTO v_count FROM group_prompts WHERE week_of = v_week;
  RAISE NOTICE 'Fixed % prompts for week: %', v_count, v_week;
END $$;
