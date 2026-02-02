-- =====================================================
-- FIX: Aggregate function (SUM) not allowed in UPDATE
-- The update_profile_points() trigger uses SUM in subquery
-- Run this in Supabase Dashboard -> SQL Editor
-- =====================================================

CREATE OR REPLACE FUNCTION update_profile_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_points INTEGER;
BEGIN
  -- Calculate total points separately (not in UPDATE subquery)
  SELECT COALESCE(SUM(wp.points_answering + wp.points_voting + wp.points_quiplash_wins), 0)
  INTO v_total_points
  FROM weekly_points wp
  JOIN group_members gm ON gm.group_id = wp.group_id AND gm.user_id = wp.user_id
  WHERE wp.user_id = NEW.user_id;

  -- Update with the calculated value
  UPDATE profiles
  SET total_points = v_total_points
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;
