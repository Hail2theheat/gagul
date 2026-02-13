-- 050: Add username and avatar_config to leaderboard
-- This fixes the display of user info in the Weekly Champions view

CREATE OR REPLACE FUNCTION get_weekly_leaderboard(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_result JSONB;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', now())::date);

  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', wp.user_id,
      'username', COALESCE(p.username, 'Anonymous'),
      'avatar_config', p.avatar_config,
      'points_answering', wp.points_answering,
      'points_voting', wp.points_voting,
      'points_quiplash_wins', wp.points_quiplash_wins,
      'total_points', wp.points_answering + wp.points_voting + wp.points_quiplash_wins
    ) ORDER BY (wp.points_answering + wp.points_voting + wp.points_quiplash_wins) DESC
  ) INTO v_result
  FROM weekly_points wp
  LEFT JOIN profiles p ON p.id = wp.user_id
  WHERE wp.group_id = p_group_id AND wp.week_of = v_week;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
