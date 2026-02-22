-- Add tap_count to response_reactions so repeated taps of the same emoji
-- accumulate and replay the correct number of floating emojis on load.

ALTER TABLE response_reactions
  ADD COLUMN IF NOT EXISTS tap_count INTEGER NOT NULL DEFAULT 1;

-- New RPC: increment reaction (replaces toggle for emoji taps)
-- Same emoji = increment tap_count
-- Different emoji = switch to new emoji, reset tap_count to 1
-- No existing reaction = insert with tap_count 1
CREATE OR REPLACE FUNCTION add_reaction(p_response_id UUID, p_emoji TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing RECORD;
BEGIN
  SELECT id, emoji, tap_count INTO v_existing
  FROM response_reactions
  WHERE response_id = p_response_id AND user_id = auth.uid();

  IF v_existing IS NULL THEN
    -- No reaction yet: insert
    INSERT INTO response_reactions (response_id, user_id, emoji, tap_count)
    VALUES (p_response_id, auth.uid(), p_emoji, 1);
    RETURN jsonb_build_object('action', 'added', 'tap_count', 1);

  ELSIF v_existing.emoji = p_emoji THEN
    -- Same emoji: increment
    UPDATE response_reactions
    SET tap_count = v_existing.tap_count + 1
    WHERE id = v_existing.id;
    RETURN jsonb_build_object('action', 'incremented', 'tap_count', v_existing.tap_count + 1);

  ELSE
    -- Different emoji: switch and reset count
    UPDATE response_reactions
    SET emoji = p_emoji, tap_count = 1
    WHERE id = v_existing.id;
    RETURN jsonb_build_object('action', 'switched', 'tap_count', 1);
  END IF;
END;
$$;

-- Update get_response_reactions to use SUM(tap_count) instead of COUNT(*)
CREATE OR REPLACE FUNCTION get_response_reactions(p_response_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reactions JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'emoji', emoji,
    'count', total_taps,
    'users', users
  ))
  INTO v_reactions
  FROM (
    SELECT
      emoji,
      SUM(tap_count) as total_taps,
      jsonb_agg(jsonb_build_object('user_id', user_id)) as users
    FROM response_reactions
    WHERE response_id = p_response_id
    GROUP BY emoji
  ) sub;

  RETURN COALESCE(v_reactions, '[]'::jsonb);
END;
$$;
