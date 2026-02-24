-- ============================================================
-- 149: Monthly Season System
-- Tracks monthly champions per group with trophy counts
-- ============================================================

-- 1. Season winners table
CREATE TABLE IF NOT EXISTS season_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_month DATE NOT NULL,  -- first day of month, e.g. '2026-02-01'
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, season_month)
);

CREATE INDEX IF NOT EXISTS idx_season_winners_group ON season_winners(group_id);
CREATE INDEX IF NOT EXISTS idx_season_winners_user ON season_winners(user_id);

-- RLS
ALTER TABLE season_winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members view season winners" ON season_winners;
CREATE POLICY "Group members view season winners" ON season_winners
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = season_winners.group_id AND gm.user_id = auth.uid()
  )
);

-- 2. Get season leaderboard — aggregates weekly_points for a given month
CREATE OR REPLACE FUNCTION get_season_leaderboard(p_group_id UUID, p_season_start DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_season DATE;
  v_next_month DATE;
  v_result JSONB;
BEGIN
  -- Default to first day of current month
  IF p_season_start IS NULL THEN
    v_season := date_trunc('month', now())::date;
  ELSE
    v_season := p_season_start;
  END IF;
  v_next_month := (v_season + interval '1 month')::date;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'user_id', user_data.user_id,
      'username', user_data.username,
      'avatar_config', user_data.avatar_config,
      'total_points', user_data.total_points
    ) ORDER BY user_data.total_points DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      gm.user_id,
      p.username,
      p.avatar_config,
      COALESCE(SUM(wp.points_answering + wp.points_voting + wp.points_quiplash_wins), 0) as total_points
    FROM group_members gm
    JOIN profiles p ON p.id = gm.user_id
    LEFT JOIN weekly_points wp ON wp.user_id = gm.user_id
      AND wp.group_id = p_group_id
      AND wp.week_of >= v_season
      AND wp.week_of < v_next_month
    WHERE gm.group_id = p_group_id
    GROUP BY gm.user_id, p.username, p.avatar_config
  ) user_data
  WHERE user_data.total_points > 0;

  RETURN v_result;
END;
$$;

-- 3. Get trophy leaders — counts season_winners per user in a group
CREATE OR REPLACE FUNCTION get_season_trophy_leaders(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'user_id', leader_data.user_id,
      'username', leader_data.username,
      'avatar_config', leader_data.avatar_config,
      'trophy_count', leader_data.trophy_count,
      'total_season_points', leader_data.total_season_points
    ) ORDER BY leader_data.trophy_count DESC, leader_data.total_season_points DESC
  ), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      sw.user_id,
      p.username,
      p.avatar_config,
      COUNT(*) as trophy_count,
      SUM(sw.total_points) as total_season_points
    FROM season_winners sw
    JOIN profiles p ON p.id = sw.user_id
    WHERE sw.group_id = p_group_id
    GROUP BY sw.user_id, p.username, p.avatar_config
  ) leader_data;

  RETURN v_result;
END;
$$;

-- 4. Finalize season — idempotent; finds top scorer and inserts into season_winners
CREATE OR REPLACE FUNCTION finalize_season(p_group_id UUID, p_season_month DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_next_month DATE;
  v_winner_user_id UUID;
  v_winner_points INTEGER;
BEGIN
  -- Check if already finalized
  IF EXISTS (
    SELECT 1 FROM season_winners
    WHERE group_id = p_group_id AND season_month = p_season_month
  ) THEN
    -- Return existing winner
    RETURN (
      SELECT jsonb_build_object(
        'already_finalized', true,
        'user_id', sw.user_id,
        'total_points', sw.total_points
      )
      FROM season_winners sw
      WHERE sw.group_id = p_group_id AND sw.season_month = p_season_month
    );
  END IF;

  v_next_month := (p_season_month + interval '1 month')::date;

  -- Find the top scorer for this month
  SELECT
    wp.user_id,
    SUM(wp.points_answering + wp.points_voting + wp.points_quiplash_wins) as total
  INTO v_winner_user_id, v_winner_points
  FROM weekly_points wp
  WHERE wp.group_id = p_group_id
    AND wp.week_of >= p_season_month
    AND wp.week_of < v_next_month
  GROUP BY wp.user_id
  ORDER BY total DESC
  LIMIT 1;

  -- No participants
  IF v_winner_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No participants this season');
  END IF;

  -- Insert winner
  INSERT INTO season_winners (group_id, user_id, season_month, total_points)
  VALUES (p_group_id, v_winner_user_id, p_season_month, v_winner_points);

  RETURN jsonb_build_object(
    'finalized', true,
    'user_id', v_winner_user_id,
    'total_points', v_winner_points
  );
END;
$$;
