-- Fix group streak: prevent double-processing and count fireside participation
--
-- Bugs fixed:
-- 1. The cron runs hourly with a 2-hour expiry window, so the same prompt
--    gets processed on two consecutive runs. On the second run last_streak_date
--    already equals prompt_date, hitting the ELSE branch and resetting
--    the streak to 1 (or 0). Fixed by skipping prompts whose date
--    has already been recorded in last_streak_date.
-- 2. Only responses counted toward participation. Now fireside comments
--    and reactions also count, so members who engage during the fireside
--    are not penalized.

-- Improved participation check: responses + fireside comments + reactions
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
    (SELECT COUNT(*)::INTEGER FROM group_members gm WHERE gm.group_id = gp.group_id) AS total_members,
    (
      SELECT COUNT(DISTINCT p.user_id)::INTEGER
      FROM (
        -- answered the prompt
        SELECT r.user_id FROM responses r WHERE r.group_prompt_id = p_group_prompt_id
        UNION
        -- commented on any response to this prompt (fireside)
        SELECT fc.user_id FROM fireside_comments fc
          JOIN responses r ON r.id = fc.response_id
         WHERE r.group_prompt_id = p_group_prompt_id
        UNION
        -- reacted to any response to this prompt (fireside)
        SELECT rr.user_id FROM response_reactions rr
          JOIN responses r ON r.id = rr.response_id
         WHERE r.group_prompt_id = p_group_prompt_id
      ) p
      -- only count actual group members
      JOIN group_members gm ON gm.group_id = gp.group_id AND gm.user_id = p.user_id
    ) AS respondents,
    (
      SELECT COUNT(DISTINCT p.user_id)::FLOAT
      FROM (
        SELECT r.user_id FROM responses r WHERE r.group_prompt_id = p_group_prompt_id
        UNION
        SELECT fc.user_id FROM fireside_comments fc
          JOIN responses r ON r.id = fc.response_id
         WHERE r.group_prompt_id = p_group_prompt_id
        UNION
        SELECT rr.user_id FROM response_reactions rr
          JOIN responses r ON r.id = rr.response_id
         WHERE r.group_prompt_id = p_group_prompt_id
      ) p
      JOIN group_members gm ON gm.group_id = gp.group_id AND gm.user_id = p.user_id
    ) >= (SELECT COUNT(*)::FLOAT * 0.5 FROM group_members gm WHERE gm.group_id = gp.group_id) AS met_threshold
  FROM group_prompts gp
  WHERE gp.id = p_group_prompt_id;
END;
$$;

-- Rewrite update_group_streaks with double-processing guard
CREATE OR REPLACE FUNCTION update_group_streaks()
RETURNS TABLE(group_id UUID, new_streak INTEGER, streak_broken BOOLEAN) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group RECORD;
  v_check RECORD;
  v_current_group RECORD;
BEGIN
  -- Find prompts that expired recently (last 2 hours)
  FOR v_group IN
    SELECT DISTINCT gp.group_id, gp.id AS group_prompt_id, gp.expires_at::date AS prompt_date
    FROM group_prompts gp
    WHERE gp.expires_at BETWEEN now() - interval '2 hours' AND now()
      AND gp.is_active = true
  LOOP
    -- Guard: skip if we already processed this day for this group
    SELECT * INTO v_current_group FROM groups g WHERE g.id = v_group.group_id;
    IF v_current_group.last_streak_date IS NOT NULL
       AND v_current_group.last_streak_date >= v_group.prompt_date THEN
      -- Already processed this date (or a later one) — skip
      CONTINUE;
    END IF;

    -- Check participation for this prompt (now includes fireside)
    SELECT * INTO v_check FROM check_group_prompt_participation(v_group.group_prompt_id);

    IF v_check.met_threshold THEN
      -- Met 50%+ threshold — increment streak
      UPDATE groups g
      SET
        current_streak = CASE
          WHEN v_current_group.last_streak_date = v_group.prompt_date - interval '1 day'
               OR v_current_group.last_streak_date IS NULL
          THEN v_current_group.current_streak + 1
          ELSE 1  -- gap in dates, restart at 1
        END,
        longest_streak = GREATEST(v_current_group.longest_streak,
          CASE
            WHEN v_current_group.last_streak_date = v_group.prompt_date - interval '1 day'
                 OR v_current_group.last_streak_date IS NULL
            THEN v_current_group.current_streak + 1
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
      -- Didn't meet threshold — break streak
      UPDATE groups g
      SET current_streak = 0,
          last_streak_date = v_group.prompt_date
      WHERE g.id = v_group.group_id;

      SELECT v_group.group_id, 0, true
      INTO group_id, new_streak, streak_broken;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- Also fix the personal streak breaker to count fireside engagement
CREATE OR REPLACE FUNCTION check_and_break_streaks()
RETURNS TABLE(user_id UUID, old_streak INTEGER) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH expired_prompts AS (
    SELECT gp.id AS group_prompt_id, gp.group_id
    FROM group_prompts gp
    WHERE gp.expires_at BETWEEN now() - interval '2 hours' AND now()
      AND gp.is_active = true
  ),
  participants AS (
    -- Users who responded
    SELECT r.user_id, r.group_prompt_id
    FROM responses r
    WHERE r.group_prompt_id IN (SELECT ep.group_prompt_id FROM expired_prompts ep)
    UNION
    -- Users who commented on responses (fireside)
    SELECT fc.user_id, r.group_prompt_id
    FROM fireside_comments fc
    JOIN responses r ON r.id = fc.response_id
    WHERE r.group_prompt_id IN (SELECT ep.group_prompt_id FROM expired_prompts ep)
    UNION
    -- Users who reacted to responses (fireside)
    SELECT rr.user_id, r.group_prompt_id
    FROM response_reactions rr
    JOIN responses r ON r.id = rr.response_id
    WHERE r.group_prompt_id IN (SELECT ep.group_prompt_id FROM expired_prompts ep)
  ),
  users_who_missed AS (
    SELECT DISTINCT gm.user_id, ep.group_prompt_id
    FROM expired_prompts ep
    JOIN group_members gm ON gm.group_id = ep.group_id
    LEFT JOIN participants p ON p.group_prompt_id = ep.group_prompt_id AND p.user_id = gm.user_id
    WHERE p.user_id IS NULL
  ),
  streak_breaks AS (
    UPDATE profiles p
    SET current_streak = 0
    FROM users_who_missed uwm
    WHERE p.id = uwm.user_id
      AND p.current_streak > 0
    RETURNING p.id AS user_id, p.current_streak AS old_streak
  )
  SELECT sb.user_id, sb.old_streak FROM streak_breaks sb;
END;
$$;
