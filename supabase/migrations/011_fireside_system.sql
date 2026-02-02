-- Fireside/Lowdown System - Phase 1: Database Schema

-- 1. Comments on responses (real-time during Fireside)
CREATE TABLE IF NOT EXISTS fireside_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 200),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fireside_comments_response ON fireside_comments(response_id);
CREATE INDEX IF NOT EXISTS idx_fireside_comments_created ON fireside_comments(created_at DESC);

-- 2. Weekly points per user per group
CREATE TABLE IF NOT EXISTS weekly_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  points_answering INTEGER DEFAULT 0,
  points_voting INTEGER DEFAULT 0,
  points_quiplash_wins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_weekly_points_group_week ON weekly_points(group_id, week_of);

-- 3. Weekly winners and their prompt choice
CREATE TABLE IF NOT EXISTS weekly_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  winner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chosen_prompt_id UUID REFERENCES prompts(id),
  custom_prompt_content TEXT,
  custom_prompt_type TEXT CHECK (custom_prompt_type IN ('short_text', 'long_text', 'photo', 'multiple_choice', 'quiz', 'quiplash')),
  has_chosen BOOLEAN DEFAULT false,
  prompt_choices JSONB, -- Store the 3 prompt options shown to winner
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, week_of)
);

-- 4. Pair quiplash matchups with regular prompts (for voting during week)
ALTER TABLE group_prompts
  ADD COLUMN IF NOT EXISTS paired_matchup_id UUID;

-- 5. RLS Policies
ALTER TABLE fireside_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_winners ENABLE ROW LEVEL SECURITY;

-- Comments: group members can view and insert
DROP POLICY IF EXISTS "Group members view comments" ON fireside_comments;
CREATE POLICY "Group members view comments" ON fireside_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM responses r
    JOIN group_prompts gp ON gp.id = r.group_prompt_id
    JOIN group_members gm ON gm.group_id = gp.group_id
    WHERE r.id = fireside_comments.response_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users insert own comments" ON fireside_comments;
CREATE POLICY "Users insert own comments" ON fireside_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Points: group members can view
DROP POLICY IF EXISTS "Group members view points" ON weekly_points;
CREATE POLICY "Group members view points" ON weekly_points
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = weekly_points.group_id AND gm.user_id = auth.uid()
  )
);

-- Winners: group members can view, winner can update their choice
DROP POLICY IF EXISTS "Group members view winners" ON weekly_winners;
CREATE POLICY "Group members view winners" ON weekly_winners
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = weekly_winners.group_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Winner can update choice" ON weekly_winners;
CREATE POLICY "Winner can update choice" ON weekly_winners
FOR UPDATE USING (auth.uid() = winner_user_id);

-- 6. Points configuration
-- Answering a prompt: 10 points
-- Voting on quiplash: 5 points
-- Winning quiplash matchup: 20 points

-- 7. Function to award points for answering
CREATE OR REPLACE FUNCTION award_answer_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
  v_week DATE;
BEGIN
  -- Get group_id from the group_prompt
  SELECT gp.group_id, gp.week_of INTO v_group_id, v_week
  FROM group_prompts gp WHERE gp.id = NEW.group_prompt_id;

  IF v_group_id IS NOT NULL THEN
    INSERT INTO weekly_points (group_id, user_id, week_of, points_answering)
    VALUES (v_group_id, NEW.user_id, COALESCE(v_week, date_trunc('week', now())::date), 10)
    ON CONFLICT (group_id, user_id, week_of)
    DO UPDATE SET
      points_answering = weekly_points.points_answering + 10,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_answer_points ON responses;
CREATE TRIGGER trigger_award_answer_points
AFTER INSERT ON responses
FOR EACH ROW EXECUTE FUNCTION award_answer_points();

-- 8. Function to award points for voting
CREATE OR REPLACE FUNCTION award_vote_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
  v_week DATE;
BEGIN
  -- Get group_id from the matchup's group_prompt
  SELECT gp.group_id, gp.week_of INTO v_group_id, v_week
  FROM quiplash_assignments qa
  JOIN group_prompts gp ON gp.id = qa.group_prompt_id
  WHERE qa.matchup_id = NEW.matchup_id
  LIMIT 1;

  IF v_group_id IS NOT NULL THEN
    INSERT INTO weekly_points (group_id, user_id, week_of, points_voting)
    VALUES (v_group_id, NEW.voter_id, COALESCE(v_week, date_trunc('week', now())::date), 5)
    ON CONFLICT (group_id, user_id, week_of)
    DO UPDATE SET
      points_voting = weekly_points.points_voting + 5,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_award_vote_points ON quiplash_votes;
CREATE TRIGGER trigger_award_vote_points
AFTER INSERT ON quiplash_votes
FOR EACH ROW EXECUTE FUNCTION award_vote_points();

-- 9. Function to get weekly leaderboard
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
      'points_answering', wp.points_answering,
      'points_voting', wp.points_voting,
      'points_quiplash_wins', wp.points_quiplash_wins,
      'total_points', wp.points_answering + wp.points_voting + wp.points_quiplash_wins
    ) ORDER BY (wp.points_answering + wp.points_voting + wp.points_quiplash_wins) DESC
  ) INTO v_result
  FROM weekly_points wp
  WHERE wp.group_id = p_group_id AND wp.week_of = v_week;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 10. Function to calculate quiplash winners and award points
CREATE OR REPLACE FUNCTION calculate_quiplash_winners(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_matchup RECORD;
  v_winner_response_id UUID;
  v_winner_user_id UUID;
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
    -- Find winning response (most votes)
    SELECT qv.voted_for_response_id, r.user_id
    INTO v_winner_response_id, v_winner_user_id
    FROM quiplash_votes qv
    JOIN responses r ON r.id = qv.voted_for_response_id
    WHERE qv.matchup_id = v_matchup.matchup_id
    GROUP BY qv.voted_for_response_id, r.user_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    IF v_winner_user_id IS NOT NULL THEN
      -- Award points to winner
      INSERT INTO weekly_points (group_id, user_id, week_of, points_quiplash_wins)
      VALUES (p_group_id, v_winner_user_id, v_week, 20)
      ON CONFLICT (group_id, user_id, week_of)
      DO UPDATE SET
        points_quiplash_wins = weekly_points.points_quiplash_wins + 20,
        updated_at = now();

      v_results := v_results || jsonb_build_object(
        'matchup_id', v_matchup.matchup_id,
        'winner_user_id', v_winner_user_id,
        'winner_response_id', v_winner_response_id
      );
    END IF;
  END LOOP;

  RETURN v_results;
END;
$$;

-- 11. Function to determine weekly winner and generate prompt choices
CREATE OR REPLACE FUNCTION finalize_week(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_winner_user_id UUID;
  v_total_points INT;
  v_prompt_choices JSONB;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', now())::date);

  -- First, calculate quiplash winners
  PERFORM calculate_quiplash_winners(p_group_id, v_week);

  -- Find the user with most points
  SELECT user_id, (points_answering + points_voting + points_quiplash_wins)
  INTO v_winner_user_id, v_total_points
  FROM weekly_points
  WHERE group_id = p_group_id AND week_of = v_week
  ORDER BY (points_answering + points_voting + points_quiplash_wins) DESC
  LIMIT 1;

  IF v_winner_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No participants this week');
  END IF;

  -- Generate 3 random prompt choices for the winner
  SELECT jsonb_agg(jsonb_build_object('id', id, 'type', type, 'content', content, 'title', title))
  INTO v_prompt_choices
  FROM (
    SELECT id, type, content, title
    FROM prompts
    WHERE is_active = true AND type != 'quiplash'
    ORDER BY random()
    LIMIT 3
  ) p;

  -- Insert or update weekly winner
  INSERT INTO weekly_winners (group_id, week_of, winner_user_id, prompt_choices)
  VALUES (p_group_id, v_week, v_winner_user_id, v_prompt_choices)
  ON CONFLICT (group_id, week_of)
  DO UPDATE SET
    winner_user_id = v_winner_user_id,
    prompt_choices = v_prompt_choices;

  RETURN jsonb_build_object(
    'success', true,
    'winner_user_id', v_winner_user_id,
    'total_points', v_total_points,
    'prompt_choices', v_prompt_choices
  );
END;
$$;

-- 12. Function for winner to choose/create prompt
CREATE OR REPLACE FUNCTION winner_choose_prompt(
  p_group_id UUID,
  p_week_of DATE,
  p_chosen_prompt_id UUID DEFAULT NULL,
  p_custom_content TEXT DEFAULT NULL,
  p_custom_type TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_winner RECORD;
BEGIN
  -- Verify caller is the winner
  SELECT * INTO v_winner
  FROM weekly_winners
  WHERE group_id = p_group_id AND week_of = p_week_of AND winner_user_id = auth.uid();

  IF v_winner.id IS NULL THEN
    RETURN jsonb_build_object('error', 'You are not the winner for this week');
  END IF;

  IF v_winner.has_chosen THEN
    RETURN jsonb_build_object('error', 'Already chose a prompt');
  END IF;

  -- Update with choice
  UPDATE weekly_winners
  SET
    chosen_prompt_id = p_chosen_prompt_id,
    custom_prompt_content = p_custom_content,
    custom_prompt_type = p_custom_type,
    has_chosen = true
  WHERE id = v_winner.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 13. Function to get fireside data for a group
CREATE OR REPLACE FUNCTION get_fireside_data(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_prompts JSONB;
  v_leaderboard JSONB;
  v_winner JSONB;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', now())::date);

  -- Get all prompts with responses for this week (chronologically)
  SELECT jsonb_agg(prompt_data ORDER BY scheduled_for)
  INTO v_prompts
  FROM (
    SELECT
      gp.id as group_prompt_id,
      gp.scheduled_for,
      p.id as prompt_id,
      p.type,
      p.content,
      p.title,
      p.options,
      p.correct_answer,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'response_id', r.id,
          'user_id', r.user_id,
          'content', r.content,
          'media_url', r.media_url,
          'selected_option', r.selected_option,
          'submitted_at', r.submitted_at
        ))
        FROM responses r
        WHERE r.group_prompt_id = gp.id
      ) as responses,
      CASE WHEN p.type = 'quiplash' THEN (
        SELECT jsonb_agg(jsonb_build_object(
          'matchup_id', qa.matchup_id,
          'user_id', qa.user_id,
          'response', (
            SELECT jsonb_build_object('id', r.id, 'content', r.content)
            FROM responses r
            WHERE r.group_prompt_id = gp.id AND r.user_id = qa.user_id
          ),
          'votes', (
            SELECT COUNT(*)
            FROM quiplash_votes qv
            JOIN responses r ON r.id = qv.voted_for_response_id
            WHERE qv.matchup_id = qa.matchup_id AND r.user_id = qa.user_id
          )
        ))
        FROM quiplash_assignments qa
        WHERE qa.group_prompt_id = gp.id
      ) END as quiplash_data
    FROM group_prompts gp
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id AND gp.week_of = v_week
  ) prompt_data;

  -- Get leaderboard
  v_leaderboard := get_weekly_leaderboard(p_group_id, v_week);

  -- Get winner info
  SELECT jsonb_build_object(
    'user_id', winner_user_id,
    'has_chosen', has_chosen,
    'chosen_prompt_id', chosen_prompt_id,
    'custom_prompt_content', custom_prompt_content,
    'prompt_choices', prompt_choices
  ) INTO v_winner
  FROM weekly_winners
  WHERE group_id = p_group_id AND week_of = v_week;

  RETURN jsonb_build_object(
    'week_of', v_week,
    'prompts', COALESCE(v_prompts, '[]'::jsonb),
    'leaderboard', COALESCE(v_leaderboard, '[]'::jsonb),
    'winner', v_winner
  );
END;
$$;

-- 14. Function to add a comment (returns for real-time)
CREATE OR REPLACE FUNCTION add_fireside_comment(p_response_id UUID, p_content TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  INSERT INTO fireside_comments (response_id, user_id, content)
  VALUES (p_response_id, auth.uid(), p_content)
  RETURNING id INTO v_comment_id;

  RETURN jsonb_build_object(
    'id', v_comment_id,
    'response_id', p_response_id,
    'user_id', auth.uid(),
    'content', p_content,
    'created_at', now()
  );
END;
$$;

-- 15. Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE fireside_comments;
