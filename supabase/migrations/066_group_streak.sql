-- Group streak system - tracks days where 50%+ of members responded

-- Add streak fields to groups
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_date DATE;

-- Function to check if a group met the 50% threshold for a prompt
CREATE OR REPLACE FUNCTION check_group_prompt_participation(p_group_prompt_id UUID)
RETURNS TABLE(
  group_id UUID,
  total_members INTEGER,
  respondents INTEGER,
  met_threshold BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    gp.group_id,
    (SELECT COUNT(*)::INTEGER FROM group_members gm WHERE gm.group_id = gp.group_id) as total_members,
    (SELECT COUNT(DISTINCT r.user_id)::INTEGER FROM responses r WHERE r.group_prompt_id = p_group_prompt_id) as respondents,
    (SELECT COUNT(DISTINCT r.user_id)::FLOAT FROM responses r WHERE r.group_prompt_id = p_group_prompt_id) >=
    (SELECT COUNT(*)::FLOAT * 0.5 FROM group_members gm WHERE gm.group_id = gp.group_id) as met_threshold
  FROM group_prompts gp
  WHERE gp.id = p_group_prompt_id;
END;
$$;

-- Function to update group streak when prompt expires
CREATE OR REPLACE FUNCTION update_group_streaks()
RETURNS TABLE(group_id UUID, new_streak INTEGER, streak_broken BOOLEAN) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group RECORD;
  v_check RECORD;
BEGIN
  -- Find prompts that expired recently (last 2 hours)
  FOR v_group IN
    SELECT DISTINCT gp.group_id, gp.id as group_prompt_id, gp.expires_at::date as prompt_date
    FROM group_prompts gp
    WHERE gp.expires_at BETWEEN now() - interval '2 hours' AND now()
      AND gp.is_active = true
  LOOP
    -- Check participation for this prompt
    SELECT * INTO v_check FROM check_group_prompt_participation(v_group.group_prompt_id);

    IF v_check.met_threshold THEN
      -- Met threshold - increment or continue streak
      UPDATE groups g
      SET
        current_streak = CASE
          WHEN last_streak_date = v_group.prompt_date - interval '1 day' OR last_streak_date IS NULL
          THEN current_streak + 1
          ELSE 1
        END,
        longest_streak = GREATEST(longest_streak,
          CASE
            WHEN last_streak_date = v_group.prompt_date - interval '1 day' OR last_streak_date IS NULL
            THEN current_streak + 1
            ELSE 1
          END
        ),
        last_streak_date = v_group.prompt_date
      WHERE g.id = v_group.group_id;

      SELECT v_group.group_id, g.current_streak, false
      INTO group_id, new_streak, streak_broken
      FROM groups g WHERE g.id = v_group.group_id;
      RETURN NEXT;
    ELSE
      -- Didn't meet threshold - break streak
      UPDATE groups g
      SET current_streak = 0
      WHERE g.id = v_group.group_id
        AND current_streak > 0;

      SELECT v_group.group_id, 0, true
      INTO group_id, new_streak, streak_broken;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- Initialize your group's streak to 2 (based on yesterday)
UPDATE groups
SET current_streak = 2, longest_streak = 2, last_streak_date = CURRENT_DATE - 1
WHERE current_streak = 0 OR current_streak IS NULL;

-- Add to cron schedule
SELECT cron.schedule(
  'update-group-streaks',
  '10 * * * *',  -- 10 minutes past each hour
  $$
  SELECT update_group_streaks();
  $$
);
