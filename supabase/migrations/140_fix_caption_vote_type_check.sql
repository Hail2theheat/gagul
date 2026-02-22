-- Fix submit_caption_vote to accept meme_caption prompts too
CREATE OR REPLACE FUNCTION submit_caption_vote(
  p_group_prompt_id UUID,
  p_response_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_response_owner UUID;
  v_prompt_type TEXT;
BEGIN
  -- Verify this is a caption-votable prompt
  SELECT p.type INTO v_prompt_type
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.id = p_group_prompt_id;

  IF v_prompt_type NOT IN ('photo_caption', 'meme_caption') THEN
    RETURN jsonb_build_object('error', 'Not a caption prompt');
  END IF;

  -- Get the response owner to prevent self-voting
  SELECT user_id INTO v_response_owner
  FROM responses
  WHERE id = p_response_id AND group_prompt_id = p_group_prompt_id;

  IF v_response_owner IS NULL THEN
    RETURN jsonb_build_object('error', 'Response not found');
  END IF;

  IF v_response_owner = auth.uid() THEN
    RETURN jsonb_build_object('error', 'Cannot vote for your own caption');
  END IF;

  -- Upsert the vote
  INSERT INTO caption_votes (group_prompt_id, voter_id, voted_for_response_id)
  VALUES (p_group_prompt_id, auth.uid(), p_response_id)
  ON CONFLICT (group_prompt_id, voter_id)
  DO UPDATE SET voted_for_response_id = p_response_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
