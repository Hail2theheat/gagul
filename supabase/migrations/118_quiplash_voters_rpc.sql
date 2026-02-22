-- RPC to get quiplash voters with their profile info
CREATE OR REPLACE FUNCTION get_quiplash_voters(p_matchup_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(json_build_object(
      'voter_id', qv.voter_id,
      'voted_for_response_id', qv.voted_for_response_id::text,
      'username', COALESCE(p.username, 'Anonymous'),
      'avatar_config', p.avatar_config
    )), '[]'::json)
    FROM quiplash_votes qv
    LEFT JOIN profiles p ON p.id = qv.voter_id
    WHERE qv.matchup_id = p_matchup_id
  );
END;
$$;
