-- Points system for gagul

-- Add points column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_streak_bonus_week DATE;

-- Point events log (for history and debugging)
CREATE TABLE IF NOT EXISTS point_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'response', 'comment', 'like_received', 'photo_bonus', 'rating', 'quiplash_win', 'fireside', 'perfect_week', 'streak_bonus'
  points INTEGER NOT NULL,
  reference_id UUID, -- optional reference to response/comment/etc
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_events_user ON point_events(user_id);
CREATE INDEX IF NOT EXISTS idx_point_events_created ON point_events(created_at);

-- Enable RLS
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;

-- Users can see their own point events
CREATE POLICY "Users view own points" ON point_events FOR SELECT USING (auth.uid() = user_id);

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_event_type TEXT,
  p_points INTEGER,
  p_group_id UUID DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Log the point event
  INSERT INTO point_events (user_id, group_id, event_type, points, reference_id)
  VALUES (p_user_id, p_group_id, p_event_type, p_points, p_reference_id);

  -- Update user's total points
  UPDATE profiles
  SET total_points = COALESCE(total_points, 0) + p_points,
      weekly_points = COALESCE(weekly_points, 0) + p_points
  WHERE id = p_user_id;

  RETURN p_points;
END;
$$;

-- Function to check and award streak bonus (call weekly)
CREATE OR REPLACE FUNCTION check_streak_bonus(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_streak INTEGER;
  v_last_bonus DATE;
  v_current_week DATE;
BEGIN
  v_current_week := date_trunc('week', CURRENT_DATE)::DATE;

  SELECT current_streak, last_streak_bonus_week
  INTO v_streak, v_last_bonus
  FROM profiles WHERE id = p_user_id;

  -- If streak is 7+ and haven't got bonus this week
  IF v_streak >= 7 AND (v_last_bonus IS NULL OR v_last_bonus < v_current_week) THEN
    -- Award 1 bonus point
    PERFORM award_points(p_user_id, 'streak_bonus', 1, NULL, NULL);

    -- Mark bonus as claimed this week
    UPDATE profiles SET last_streak_bonus_week = v_current_week WHERE id = p_user_id;

    RETURN 1;
  END IF;

  RETURN 0;
END;
$$;

-- Function to check perfect week and award bonus
CREATE OR REPLACE FUNCTION check_perfect_week(p_user_id UUID, p_group_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week_start DATE;
  v_prompts_count INTEGER;
  v_responses_count INTEGER;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;

  -- Count prompts this week for the group
  SELECT COUNT(*) INTO v_prompts_count
  FROM group_prompts
  WHERE group_id = p_group_id
    AND week_of = v_week_start;

  -- Count user's responses this week
  SELECT COUNT(*) INTO v_responses_count
  FROM responses r
  JOIN group_prompts gp ON gp.id = r.group_prompt_id
  WHERE r.user_id = p_user_id
    AND gp.group_id = p_group_id
    AND gp.week_of = v_week_start;

  -- If all prompts answered (and at least 7)
  IF v_prompts_count >= 7 AND v_responses_count >= v_prompts_count THEN
    -- Check if already awarded this week for this group
    IF NOT EXISTS (
      SELECT 1 FROM point_events
      WHERE user_id = p_user_id
        AND group_id = p_group_id
        AND event_type = 'perfect_week'
        AND created_at >= v_week_start
    ) THEN
      PERFORM award_points(p_user_id, 'perfect_week', 10, p_group_id, NULL);
      RETURN 10;
    END IF;
  END IF;

  RETURN 0;
END;
$$;

-- RPC to get user's point summary
CREATE OR REPLACE FUNCTION get_points_summary(p_user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  SELECT jsonb_build_object(
    'total_points', COALESCE(p.total_points, 0),
    'weekly_points', COALESCE(p.weekly_points, 0),
    'current_streak', COALESCE(p.current_streak, 0),
    'longest_streak', COALESCE(p.longest_streak, 0),
    'recent_events', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'event_type', pe.event_type,
          'points', pe.points,
          'created_at', pe.created_at
        ) ORDER BY pe.created_at DESC
      ), '[]'::jsonb)
      FROM point_events pe
      WHERE pe.user_id = v_user_id
        AND pe.created_at > now() - interval '7 days'
      LIMIT 20
    )
  ) INTO v_result
  FROM profiles p
  WHERE p.id = v_user_id;

  RETURN v_result;
END;
$$;

-- Reset weekly points every Monday (add to cron)
-- SELECT cron.schedule('reset-weekly-points', '0 0 * * 1', 'UPDATE profiles SET weekly_points = 0');

-- Point values reference (for app code):
-- response: 3 points
-- photo_bonus: +1 point (on top of response)
-- comment: 1 point
-- like_received: 1 point
-- rating: 1 point
-- quiplash_win: 5 points
-- fireside: 5 points
-- perfect_week: 10 points
-- streak_bonus: 1 point (weekly, if streak >= 7)
