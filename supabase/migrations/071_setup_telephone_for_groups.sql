-- Set up telephone game for all groups that have at least 2 members
-- This is a one-time setup migration

DO $$
DECLARE
  v_group RECORD;
  v_result JSONB;
BEGIN
  -- Loop through all groups with enough members
  FOR v_group IN
    SELECT g.id, g.name, COUNT(gm.user_id) as member_count
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    GROUP BY g.id, g.name
    HAVING COUNT(gm.user_id) >= 2
  LOOP
    -- Check if telephone already set up for this week
    IF NOT EXISTS (
      SELECT 1 FROM telephone_chains
      WHERE group_id = v_group.id
      AND week_of = date_trunc('week', CURRENT_DATE)::DATE
    ) THEN
      -- Set up telephone game
      v_result := setup_telephone_game(v_group.id);
      RAISE NOTICE 'Set up telephone for group % (%): %', v_group.name, v_group.id, v_result;
    ELSE
      RAISE NOTICE 'Telephone already set up for group % (%)', v_group.name, v_group.id;
    END IF;
  END LOOP;
END $$;
