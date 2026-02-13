-- Streak tracking system

-- Add streak fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_response_at TIMESTAMPTZ;

-- Response log for history
CREATE TABLE IF NOT EXISTS response_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_prompt_id UUID NOT NULL REFERENCES group_prompts(id) ON DELETE CASCADE,
  responded_at TIMESTAMPTZ DEFAULT now(),
  streak_at_time INTEGER DEFAULT 0,
  UNIQUE(user_id, group_prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_response_log_user ON response_log(user_id, responded_at DESC);

-- Function to increment streak when user responds
CREATE OR REPLACE FUNCTION increment_user_streak(p_user_id UUID, p_group_prompt_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_streak INTEGER;
BEGIN
  -- Update profile streak
  UPDATE profiles
  SET
    current_streak = current_streak + 1,
    longest_streak = GREATEST(longest_streak, current_streak + 1),
    last_response_at = now()
  WHERE id = p_user_id
  RETURNING current_streak INTO v_new_streak;

  -- Log the response
  INSERT INTO response_log (user_id, group_prompt_id, streak_at_time)
  VALUES (p_user_id, p_group_prompt_id, v_new_streak)
  ON CONFLICT (user_id, group_prompt_id) DO NOTHING;

  RETURN v_new_streak;
END;
$$;

-- Function to check and break streaks for missed prompts
-- Call this after prompts expire (via cron or trigger)
CREATE OR REPLACE FUNCTION check_and_break_streaks()
RETURNS TABLE(user_id UUID, old_streak INTEGER) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH expired_prompts AS (
    -- Find prompts that expired in the last 2 hours
    SELECT gp.id as group_prompt_id, gp.group_id
    FROM group_prompts gp
    WHERE gp.expires_at BETWEEN now() - interval '2 hours' AND now()
      AND gp.is_active = true
  ),
  users_who_missed AS (
    -- Find users in those groups who didn't respond
    SELECT DISTINCT gm.user_id, ep.group_prompt_id
    FROM expired_prompts ep
    JOIN group_members gm ON gm.group_id = ep.group_id
    LEFT JOIN responses r ON r.group_prompt_id = ep.group_prompt_id AND r.user_id = gm.user_id
    WHERE r.id IS NULL
  ),
  streak_breaks AS (
    -- Break their streaks
    UPDATE profiles p
    SET current_streak = 0
    FROM users_who_missed uwm
    WHERE p.id = uwm.user_id
      AND p.current_streak > 0
    RETURNING p.id as user_id, p.current_streak as old_streak
  )
  SELECT sb.user_id, sb.old_streak FROM streak_breaks sb;
END;
$$;

-- Trigger to auto-increment streak when response is submitted
CREATE OR REPLACE FUNCTION on_response_submitted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM increment_user_streak(NEW.user_id, NEW.group_prompt_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_response_streak ON responses;
CREATE TRIGGER trigger_response_streak
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION on_response_submitted();

-- Get user streak info
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  last_response_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT p.current_streak, p.longest_streak, p.last_response_at
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- RLS for response_log
ALTER TABLE response_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own response log"
  ON response_log FOR SELECT
  USING (auth.uid() = user_id);
