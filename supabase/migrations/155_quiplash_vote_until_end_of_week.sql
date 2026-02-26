-- 155: Allow quiplash voting until end of week (Saturday 11:59 PM ET)
-- Previously, votes were rejected after the individual prompt's expires_at (24h).
-- Now votes are allowed until the end of the week (Sunday 00:00 UTC = Sat midnight ET).

CREATE OR REPLACE FUNCTION submit_quiplash_vote(p_matchup_id UUID, p_response_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_is_participant BOOLEAN;
  v_group_prompt_id UUID;
  v_week_of DATE;
  v_week_end TIMESTAMPTZ;
BEGIN
  -- SECURITY: Check the user is not voting on their own matchup
  SELECT EXISTS (
    SELECT 1 FROM quiplash_assignments
    WHERE matchup_id = p_matchup_id AND user_id = auth.uid()
  ) INTO v_is_participant;

  IF v_is_participant THEN
    RETURN jsonb_build_object('error', 'Cannot vote on your own matchup');
  END IF;

  -- Get group_prompt and its week_of
  SELECT gp.id, gp.week_of
  INTO v_group_prompt_id, v_week_of
  FROM quiplash_assignments qa
  JOIN group_prompts gp ON gp.id = qa.group_prompt_id
  WHERE qa.matchup_id = p_matchup_id
  LIMIT 1;

  IF v_group_prompt_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Matchup not found');
  END IF;

  -- Allow voting until end of the week (Sunday 06:00 UTC = Saturday midnight MT)
  v_week_end := (v_week_of + INTERVAL '7 days')::timestamp AT TIME ZONE 'America/Denver';

  IF now() > v_week_end THEN
    RETURN jsonb_build_object('error', 'Voting period has ended');
  END IF;

  -- SECURITY: Verify voter is a member of the group
  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    JOIN group_prompts gp ON gp.group_id = gm.group_id
    WHERE gp.id = v_group_prompt_id
      AND gm.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('error', 'Not a member of this group');
  END IF;

  INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
  VALUES (p_matchup_id, auth.uid(), p_response_id)
  ON CONFLICT (matchup_id, voter_id) DO UPDATE SET voted_for_response_id = p_response_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
