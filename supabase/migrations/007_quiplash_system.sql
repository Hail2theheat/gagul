-- Quiplash Assignment & Voting System

-- 1. Track which users are assigned to which quiplash prompts
CREATE TABLE IF NOT EXISTS quiplash_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_prompt_id UUID NOT NULL REFERENCES group_prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matchup_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_prompt_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_quiplash_assignments_user ON quiplash_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_quiplash_assignments_matchup ON quiplash_assignments(matchup_id);

-- 2. Track votes during Lowdown
CREATE TABLE IF NOT EXISTS quiplash_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_id UUID NOT NULL,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_for_response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matchup_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_quiplash_votes_matchup ON quiplash_votes(matchup_id);

-- 3. RLS Policies
ALTER TABLE quiplash_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiplash_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view group assignments" ON quiplash_assignments;
CREATE POLICY "Users view group assignments" ON quiplash_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_prompts gp
    JOIN group_members gm ON gm.group_id = gp.group_id
    WHERE gp.id = quiplash_assignments.group_prompt_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users insert own votes" ON quiplash_votes;
CREATE POLICY "Users insert own votes" ON quiplash_votes
FOR INSERT WITH CHECK (auth.uid() = voter_id);

DROP POLICY IF EXISTS "Users view votes" ON quiplash_votes;
CREATE POLICY "Users view votes" ON quiplash_votes
FOR SELECT USING (true);

-- 4. Function to assign quiplash prompts to group members
CREATE OR REPLACE FUNCTION assign_quiplash_prompts(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_members UUID[];
  v_member_count INT;
  v_prompts UUID[];
  v_prompt_count INT;
  v_needed_prompts INT;
  v_matchup_id UUID;
  v_group_prompt_id UUID;
  v_i INT;
  v_j INT;
  v_assigned INT := 0;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', now())::date);

  SELECT array_agg(user_id ORDER BY random()) INTO v_members
  FROM group_members WHERE group_id = p_group_id;

  v_member_count := array_length(v_members, 1);
  IF v_member_count IS NULL OR v_member_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 members for quiplash');
  END IF;

  v_needed_prompts := CEIL(v_member_count::float / 2);

  SELECT array_agg(id ORDER BY random()) INTO v_prompts
  FROM prompts WHERE type = 'quiplash' AND is_active = true;

  v_prompt_count := array_length(v_prompts, 1);
  IF v_prompt_count IS NULL OR v_prompt_count < v_needed_prompts THEN
    RETURN jsonb_build_object('error', 'Not enough quiplash prompts available');
  END IF;

  v_i := 1;
  v_j := 1;
  WHILE v_i <= v_member_count LOOP
    INSERT INTO group_prompts (group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    VALUES (
      p_group_id,
      v_prompts[v_j],
      now(),
      (date_trunc('week', now()) + interval '6 days 23 hours 59 minutes')::timestamptz,
      v_week,
      true
    )
    RETURNING id INTO v_group_prompt_id;

    v_matchup_id := gen_random_uuid();

    INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
    VALUES (v_group_prompt_id, v_members[v_i], v_matchup_id);
    v_assigned := v_assigned + 1;
    v_i := v_i + 1;

    IF v_i <= v_member_count THEN
      INSERT INTO quiplash_assignments (group_prompt_id, user_id, matchup_id)
      VALUES (v_group_prompt_id, v_members[v_i], v_matchup_id);
      v_assigned := v_assigned + 1;
      v_i := v_i + 1;
    END IF;

    v_j := v_j + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'members_assigned', v_assigned,
    'prompts_created', v_j - 1
  );
END;
$$;

-- 5. Function to get user's quiplash assignment for a group
CREATE OR REPLACE FUNCTION get_my_quiplash(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_assignment RECORD;
  v_response RECORD;
BEGIN
  SELECT qa.*, gp.id as gp_id, gp.expires_at, gp.scheduled_for,
         p.id as pid, p.type, p.content, p.title, p.category
  INTO v_assignment
  FROM quiplash_assignments qa
  JOIN group_prompts gp ON gp.id = qa.group_prompt_id
  JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id
    AND qa.user_id = auth.uid()
    AND gp.is_active = true
    AND gp.scheduled_for <= now()
    AND gp.expires_at > now()
  ORDER BY gp.scheduled_for DESC
  LIMIT 1;

  IF v_assignment.id IS NULL THEN
    RETURN jsonb_build_object('has_assignment', false);
  END IF;

  SELECT * INTO v_response
  FROM responses
  WHERE group_prompt_id = v_assignment.gp_id AND user_id = auth.uid();

  RETURN jsonb_build_object(
    'has_assignment', true,
    'group_prompt_id', v_assignment.gp_id,
    'matchup_id', v_assignment.matchup_id,
    'expires_at', v_assignment.expires_at,
    'has_responded', v_response.id IS NOT NULL,
    'prompt', jsonb_build_object(
      'id', v_assignment.pid,
      'type', v_assignment.type,
      'content', v_assignment.content,
      'title', v_assignment.title,
      'category', v_assignment.category
    )
  );
END;
$$;

-- 6. Function to get quiplash matchups for Lowdown (voting)
CREATE OR REPLACE FUNCTION get_quiplash_matchups(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_matchups JSONB := '[]'::jsonb;
  v_matchup RECORD;
  v_responses JSONB;
  v_user_assignment UUID;
  v_user_vote UUID;
BEGIN
  FOR v_matchup IN (
    SELECT DISTINCT qa.matchup_id, gp.id as group_prompt_id,
           p.content, p.title
    FROM quiplash_assignments qa
    JOIN group_prompts gp ON gp.id = qa.group_prompt_id
    JOIN prompts p ON p.id = gp.prompt_id
    WHERE gp.group_id = p_group_id
      AND p.type = 'quiplash'
      AND gp.week_of = date_trunc('week', now())::date
  ) LOOP
    SELECT jsonb_agg(jsonb_build_object(
      'response_id', r.id,
      'content', r.content,
      'user_id', r.user_id
    )) INTO v_responses
    FROM responses r
    JOIN quiplash_assignments qa ON qa.group_prompt_id = r.group_prompt_id AND qa.user_id = r.user_id
    WHERE qa.matchup_id = v_matchup.matchup_id;

    SELECT qa.id INTO v_user_assignment
    FROM quiplash_assignments qa
    WHERE qa.matchup_id = v_matchup.matchup_id AND qa.user_id = auth.uid();

    SELECT qv.voted_for_response_id INTO v_user_vote
    FROM quiplash_votes qv
    WHERE qv.matchup_id = v_matchup.matchup_id AND qv.voter_id = auth.uid();

    v_matchups := v_matchups || jsonb_build_object(
      'matchup_id', v_matchup.matchup_id,
      'prompt_content', v_matchup.content,
      'prompt_title', v_matchup.title,
      'responses', COALESCE(v_responses, '[]'::jsonb),
      'can_vote', v_user_assignment IS NULL,
      'has_voted', v_user_vote IS NOT NULL,
      'voted_for', v_user_vote
    );
  END LOOP;

  RETURN v_matchups;
END;
$$;

-- 7. Function to submit a quiplash vote
CREATE OR REPLACE FUNCTION submit_quiplash_vote(p_matchup_id UUID, p_response_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_is_participant BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM quiplash_assignments
    WHERE matchup_id = p_matchup_id AND user_id = auth.uid()
  ) INTO v_is_participant;

  IF v_is_participant THEN
    RETURN jsonb_build_object('error', 'Cannot vote on your own matchup');
  END IF;

  INSERT INTO quiplash_votes (matchup_id, voter_id, voted_for_response_id)
  VALUES (p_matchup_id, auth.uid(), p_response_id)
  ON CONFLICT (matchup_id, voter_id) DO UPDATE SET voted_for_response_id = p_response_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
