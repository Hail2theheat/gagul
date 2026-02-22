-- Fireside engagement points:
-- +2 pts to response owner when someone comments on their post
-- +1 pt to response owner when someone reacts to their post
-- +10 pt bonus when a post reaches 10+ reactions

-- Trigger: award points to response owner when their post gets a comment
CREATE OR REPLACE FUNCTION award_comment_received_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_response_owner_id UUID;
  v_group_id UUID;
  v_week_of DATE;
BEGIN
  -- Find who owns the response and which group it belongs to
  SELECT r.user_id, gp.group_id, gp.week_of
  INTO v_response_owner_id, v_group_id, v_week_of
  FROM responses r
  JOIN group_prompts gp ON gp.id = r.group_prompt_id
  WHERE r.id = NEW.response_id;

  -- Don't award points for commenting on your own post
  IF v_response_owner_id IS NOT NULL AND v_response_owner_id != NEW.user_id THEN
    INSERT INTO weekly_points (group_id, user_id, week_of, points_answering)
    VALUES (v_group_id, v_response_owner_id, v_week_of, 2)
    ON CONFLICT (group_id, user_id, week_of)
    DO UPDATE SET points_answering = weekly_points.points_answering + 2;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_comment_received_points ON fireside_comments;
CREATE TRIGGER trigger_comment_received_points
  AFTER INSERT ON fireside_comments
  FOR EACH ROW
  EXECUTE FUNCTION award_comment_received_points();

-- Trigger: award points to response owner when their post gets a reaction
CREATE OR REPLACE FUNCTION award_reaction_received_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_response_owner_id UUID;
  v_group_id UUID;
  v_week_of DATE;
  v_reaction_count INT;
BEGIN
  -- Find who owns the response
  SELECT r.user_id, gp.group_id, gp.week_of
  INTO v_response_owner_id, v_group_id, v_week_of
  FROM responses r
  JOIN group_prompts gp ON gp.id = r.group_prompt_id
  WHERE r.id = NEW.response_id;

  -- Don't award points for reacting to your own post
  IF v_response_owner_id IS NOT NULL AND v_response_owner_id != NEW.user_id THEN
    -- +1 pt per reaction
    INSERT INTO weekly_points (group_id, user_id, week_of, points_answering)
    VALUES (v_group_id, v_response_owner_id, v_week_of, 1)
    ON CONFLICT (group_id, user_id, week_of)
    DO UPDATE SET points_answering = weekly_points.points_answering + 1;

    -- Check if this response just hit 10 reactions → bonus 10 pts
    SELECT COUNT(*) INTO v_reaction_count
    FROM response_reactions
    WHERE response_id = NEW.response_id;

    IF v_reaction_count = 10 THEN
      UPDATE weekly_points
      SET points_answering = weekly_points.points_answering + 10
      WHERE group_id = v_group_id
        AND user_id = v_response_owner_id
        AND week_of = v_week_of;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reaction_received_points ON response_reactions;
CREATE TRIGGER trigger_reaction_received_points
  AFTER INSERT ON response_reactions
  FOR EACH ROW
  EXECUTE FUNCTION award_reaction_received_points();
