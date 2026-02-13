-- Points triggers for automatic point awarding

-- Trigger to award points when a quiplash winner is determined
-- This runs when finalize_week sets a winner
CREATE OR REPLACE FUNCTION award_quiplash_win_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Check if this is a quiplash matchup winner being set
  IF NEW.winner_response_id IS NOT NULL AND (OLD.winner_response_id IS NULL OR OLD.winner_response_id != NEW.winner_response_id) THEN
    -- Get the user who submitted the winning response
    DECLARE
      v_winner_user_id UUID;
    BEGIN
      SELECT user_id INTO v_winner_user_id
      FROM responses
      WHERE id = NEW.winner_response_id;

      IF v_winner_user_id IS NOT NULL THEN
        -- Award 5 points for quiplash win
        PERFORM award_points(v_winner_user_id, 'quiplash_win', 5, NEW.group_id, NEW.winner_response_id);
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Check if trigger exists before creating
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_quiplash_win_points') THEN
    CREATE TRIGGER trigger_quiplash_win_points
      AFTER UPDATE ON quiplash_matchups
      FOR EACH ROW
      EXECUTE FUNCTION award_quiplash_win_points();
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- quiplash_matchups table doesn't exist, skip
  NULL;
END $$;

-- Trigger to award points when someone receives a reaction (like)
-- We'll use the interactions table if it exists
CREATE OR REPLACE FUNCTION award_like_received_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_response_owner_id UUID;
BEGIN
  -- Only award for emoji_reaction interactions
  IF NEW.interaction_type = 'emoji_reaction' AND NEW.response_id IS NOT NULL THEN
    -- Get the owner of the response
    SELECT user_id INTO v_response_owner_id
    FROM responses
    WHERE id = NEW.response_id;

    -- Don't award points for self-reactions
    IF v_response_owner_id IS NOT NULL AND v_response_owner_id != NEW.user_id THEN
      -- Award 1 point for receiving a like
      PERFORM award_points(v_response_owner_id, 'like_received', 1, NULL, NEW.response_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Check if interactions table exists and create trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_like_received_points') THEN
      CREATE TRIGGER trigger_like_received_points
        AFTER INSERT ON interactions
        FOR EACH ROW
        EXECUTE FUNCTION award_like_received_points();
    END IF;
  END IF;
END $$;

-- Function to check and award perfect week bonus
-- Called at the end of each week (or manually)
CREATE OR REPLACE FUNCTION award_perfect_week_bonuses(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_member RECORD;
  v_total_prompts INTEGER;
  v_bonuses_awarded INTEGER := 0;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', CURRENT_DATE)::DATE);

  -- Count total prompts for the week
  SELECT COUNT(*) INTO v_total_prompts
  FROM group_prompts
  WHERE group_id = p_group_id
    AND week_of = v_week;

  -- Need at least 7 prompts for perfect week
  IF v_total_prompts < 7 THEN
    RETURN 0;
  END IF;

  -- Check each member
  FOR v_member IN
    SELECT gm.user_id
    FROM group_members gm
    WHERE gm.group_id = p_group_id
  LOOP
    -- Count their responses
    DECLARE
      v_response_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_response_count
      FROM responses r
      JOIN group_prompts gp ON gp.id = r.group_prompt_id
      WHERE r.user_id = v_member.user_id
        AND gp.group_id = p_group_id
        AND gp.week_of = v_week;

      -- If they answered all prompts
      IF v_response_count >= v_total_prompts THEN
        -- Check if not already awarded
        IF NOT EXISTS (
          SELECT 1 FROM point_events
          WHERE user_id = v_member.user_id
            AND group_id = p_group_id
            AND event_type = 'perfect_week'
            AND created_at >= v_week
            AND created_at < v_week + interval '7 days'
        ) THEN
          PERFORM award_points(v_member.user_id, 'perfect_week', 10, p_group_id, NULL);
          v_bonuses_awarded := v_bonuses_awarded + 1;
        END IF;
      END IF;
    END;
  END LOOP;

  RETURN v_bonuses_awarded;
END;
$$;

-- Reset weekly points every Monday at midnight (cron job)
-- Note: You'll need to set this up in Supabase Dashboard > Database > Extensions > pg_cron
-- SELECT cron.schedule('reset-weekly-points', '0 0 * * 1', 'UPDATE profiles SET weekly_points = 0');
