-- Fix quiplash points: 5 for a win, 2.5 each on a tie
-- Change column type to NUMERIC to support 2.5
ALTER TABLE weekly_points ALTER COLUMN points_quiplash_wins TYPE NUMERIC USING points_quiplash_wins::numeric;

-- Rewrite calculate_quiplash_winners to handle ties
CREATE OR REPLACE FUNCTION calculate_quiplash_winners(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_matchup RECORD;
  v_participant RECORD;
  v_max_votes BIGINT;
  v_winner_count INT;
  v_points_per_winner NUMERIC;
  v_results JSONB := '[]'::jsonb;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', now())::date);

  -- Loop through all matchups for this group/week
  FOR v_matchup IN (
    SELECT DISTINCT qa.matchup_id
    FROM quiplash_assignments qa
    JOIN group_prompts gp ON gp.id = qa.group_prompt_id
    WHERE gp.group_id = p_group_id AND gp.week_of = v_week
  ) LOOP
    -- Find max votes in this matchup
    SELECT MAX(vote_count) INTO v_max_votes
    FROM (
      SELECT r.user_id, COUNT(*) as vote_count
      FROM quiplash_votes qv
      JOIN responses r ON r.id = qv.voted_for_response_id
      WHERE qv.matchup_id = v_matchup.matchup_id
      GROUP BY r.user_id
    ) sub;

    IF v_max_votes IS NULL OR v_max_votes = 0 THEN
      CONTINUE;
    END IF;

    -- Count how many participants have the max votes (1 = clear winner, 2 = tie)
    SELECT COUNT(*) INTO v_winner_count
    FROM (
      SELECT r.user_id
      FROM quiplash_votes qv
      JOIN responses r ON r.id = qv.voted_for_response_id
      WHERE qv.matchup_id = v_matchup.matchup_id
      GROUP BY r.user_id
      HAVING COUNT(*) = v_max_votes
    ) sub;

    -- 5 points for solo win, split evenly on tie (2.5 each for 2-way tie)
    v_points_per_winner := 5.0 / v_winner_count;

    -- Award points to all winners
    FOR v_participant IN (
      SELECT r.user_id
      FROM quiplash_votes qv
      JOIN responses r ON r.id = qv.voted_for_response_id
      WHERE qv.matchup_id = v_matchup.matchup_id
      GROUP BY r.user_id
      HAVING COUNT(*) = v_max_votes
    ) LOOP
      INSERT INTO weekly_points (group_id, user_id, week_of, points_quiplash_wins)
      VALUES (p_group_id, v_participant.user_id, v_week, v_points_per_winner)
      ON CONFLICT (group_id, user_id, week_of)
      DO UPDATE SET
        points_quiplash_wins = weekly_points.points_quiplash_wins + v_points_per_winner,
        updated_at = now();

      v_results := v_results || jsonb_build_object(
        'matchup_id', v_matchup.matchup_id,
        'winner_user_id', v_participant.user_id,
        'points', v_points_per_winner
      );
    END LOOP;
  END LOOP;

  RETURN v_results;
END;
$$;
