-- Telephone Game - Draw/Write/Draw/Write chain game
-- Each chain alternates between drawing and writing
-- No user participates in the same chain twice

-- Telephone chains (one per starting user per week)
CREATE TABLE IF NOT EXISTS telephone_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  initial_prompt TEXT NOT NULL, -- Starting prompt like "unicorn flying to Mars"
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, week_of, initial_prompt)
);

CREATE INDEX IF NOT EXISTS idx_telephone_chains_group ON telephone_chains(group_id, week_of);

-- Steps in a telephone chain
CREATE TABLE IF NOT EXISTS telephone_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES telephone_chains(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL, -- 1, 2, 3, 4 (Day 1-4)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_type TEXT NOT NULL CHECK (step_type IN ('draw', 'write')),
  content TEXT, -- For write steps
  drawing_url TEXT, -- For draw steps (stored image path)
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(chain_id, step_number),
  UNIQUE(chain_id, user_id) -- Each user can only participate once per chain
);

CREATE INDEX IF NOT EXISTS idx_telephone_steps_chain ON telephone_steps(chain_id, step_number);
CREATE INDEX IF NOT EXISTS idx_telephone_steps_user ON telephone_steps(user_id);

-- Telephone prompts table (starting prompts for the game)
CREATE TABLE IF NOT EXISTS telephone_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some telephone prompts
INSERT INTO telephone_prompts (content, category) VALUES
  ('A unicorn flying to Mars', 'fantasy'),
  ('A cat wearing a top hat riding a skateboard', 'silly'),
  ('A dragon making breakfast', 'fantasy'),
  ('An octopus playing the piano', 'silly'),
  ('A robot walking a dog in the park', 'sci-fi'),
  ('A penguin surfing on a wave', 'animals'),
  ('A wizard casting a spell on a pizza', 'fantasy'),
  ('An astronaut dancing on the moon', 'sci-fi'),
  ('A bear having a tea party', 'animals'),
  ('A dinosaur at a birthday party', 'silly'),
  ('A mermaid reading a book underwater', 'fantasy'),
  ('A pirate ship flying through clouds', 'adventure'),
  ('A giraffe driving a race car', 'animals'),
  ('A superhero doing laundry', 'silly'),
  ('An elephant painting a masterpiece', 'animals')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE telephone_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephone_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephone_prompts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view group chains" ON telephone_chains FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = telephone_chains.group_id AND gm.user_id = auth.uid())
);

CREATE POLICY "Users view chain steps" ON telephone_steps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM telephone_chains tc
    JOIN group_members gm ON gm.group_id = tc.group_id
    WHERE tc.id = telephone_steps.chain_id AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users submit their steps" ON telephone_steps FOR UPDATE USING (
  user_id = auth.uid() AND submitted_at IS NULL
);

CREATE POLICY "View active prompts" ON telephone_prompts FOR SELECT USING (is_active = true);

-- Function to initialize telephone game for a group
-- Creates chains and assigns users to steps ensuring no one is in the same chain twice
CREATE OR REPLACE FUNCTION setup_telephone_game(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_members UUID[];
  v_member_count INTEGER;
  v_prompts TEXT[];
  v_chain_id UUID;
  v_i INTEGER;
  v_j INTEGER;
  v_assignment_matrix INTEGER[][];
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', CURRENT_DATE)::DATE);

  -- Get group members
  SELECT ARRAY_AGG(user_id ORDER BY random()) INTO v_members
  FROM group_members WHERE group_id = p_group_id;

  v_member_count := array_length(v_members, 1);

  IF v_member_count IS NULL OR v_member_count < 2 THEN
    RETURN jsonb_build_object('error', 'Need at least 2 members for telephone game');
  END IF;

  -- Check if already set up for this week
  IF EXISTS (SELECT 1 FROM telephone_chains WHERE group_id = p_group_id AND week_of = v_week) THEN
    RETURN jsonb_build_object('error', 'Telephone game already set up for this week');
  END IF;

  -- Get random prompts (one per member)
  SELECT ARRAY_AGG(content ORDER BY random()) INTO v_prompts
  FROM (SELECT content FROM telephone_prompts WHERE is_active = true LIMIT v_member_count) t;

  -- Create chains and assign users using Latin square rotation
  -- This ensures each user participates in exactly one step per chain
  -- and never in the same chain twice
  FOR v_i IN 1..v_member_count LOOP
    -- Create chain with prompt
    INSERT INTO telephone_chains (group_id, week_of, initial_prompt)
    VALUES (p_group_id, v_week, v_prompts[v_i])
    RETURNING id INTO v_chain_id;

    -- Assign users to steps (rotating assignment)
    FOR v_j IN 1..LEAST(4, v_member_count) LOOP
      -- Calculate which user gets this step using rotation
      -- User index = (i + j - 2) mod member_count + 1
      DECLARE
        v_user_idx INTEGER;
        v_step_type TEXT;
      BEGIN
        v_user_idx := ((v_i + v_j - 2) % v_member_count) + 1;
        v_step_type := CASE WHEN v_j % 2 = 1 THEN 'draw' ELSE 'write' END;

        INSERT INTO telephone_steps (chain_id, step_number, user_id, step_type)
        VALUES (v_chain_id, v_j, v_members[v_user_idx], v_step_type);
      END;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'chains_created', v_member_count,
    'week_of', v_week
  );
END;
$$;

-- Function to get user's current telephone assignment
CREATE OR REPLACE FUNCTION get_my_telephone(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
  v_step RECORD;
  v_previous_step RECORD;
  v_result JSONB;
BEGIN
  v_week := date_trunc('week', CURRENT_DATE)::DATE;

  -- Find user's pending step for this week
  SELECT ts.*, tc.initial_prompt, tc.id as chain_id
  INTO v_step
  FROM telephone_steps ts
  JOIN telephone_chains tc ON tc.id = ts.chain_id
  WHERE tc.group_id = p_group_id
    AND tc.week_of = v_week
    AND ts.user_id = auth.uid()
    AND ts.submitted_at IS NULL
    -- Only show if it's the right day or previous step is done
    AND (
      ts.step_number = 1
      OR EXISTS (
        SELECT 1 FROM telephone_steps prev
        WHERE prev.chain_id = ts.chain_id
          AND prev.step_number = ts.step_number - 1
          AND prev.submitted_at IS NOT NULL
      )
    )
  ORDER BY ts.step_number
  LIMIT 1;

  IF v_step IS NULL THEN
    RETURN jsonb_build_object('has_assignment', false);
  END IF;

  -- Get previous step's content (what they need to interpret)
  IF v_step.step_number > 1 THEN
    SELECT * INTO v_previous_step
    FROM telephone_steps
    WHERE chain_id = v_step.chain_id
      AND step_number = v_step.step_number - 1;
  END IF;

  v_result := jsonb_build_object(
    'has_assignment', true,
    'step_id', v_step.id,
    'chain_id', v_step.chain_id,
    'step_number', v_step.step_number,
    'step_type', v_step.step_type,
    'initial_prompt', CASE WHEN v_step.step_number = 1 THEN v_step.initial_prompt ELSE NULL END,
    'previous_content', v_previous_step.content,
    'previous_drawing_url', v_previous_step.drawing_url
  );

  RETURN v_result;
END;
$$;

-- Function to submit a telephone step
CREATE OR REPLACE FUNCTION submit_telephone_step(
  p_step_id UUID,
  p_content TEXT DEFAULT NULL,
  p_drawing_url TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_step RECORD;
BEGIN
  -- Get and validate the step
  SELECT * INTO v_step
  FROM telephone_steps
  WHERE id = p_step_id
    AND user_id = auth.uid()
    AND submitted_at IS NULL;

  IF v_step IS NULL THEN
    RETURN jsonb_build_object('error', 'Step not found or already submitted');
  END IF;

  -- Validate content based on step type
  IF v_step.step_type = 'draw' AND p_drawing_url IS NULL THEN
    RETURN jsonb_build_object('error', 'Drawing required for this step');
  END IF;

  IF v_step.step_type = 'write' AND (p_content IS NULL OR trim(p_content) = '') THEN
    RETURN jsonb_build_object('error', 'Description required for this step');
  END IF;

  -- Submit the step
  UPDATE telephone_steps
  SET content = p_content,
      drawing_url = p_drawing_url,
      submitted_at = now()
  WHERE id = p_step_id;

  -- Check if chain is complete
  IF NOT EXISTS (
    SELECT 1 FROM telephone_steps
    WHERE chain_id = v_step.chain_id AND submitted_at IS NULL
  ) THEN
    UPDATE telephone_chains SET is_complete = true WHERE id = v_step.chain_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to get completed telephone chains for Fireside reveal
CREATE OR REPLACE FUNCTION get_telephone_chains(p_group_id UUID, p_week_of DATE DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_week DATE;
BEGIN
  v_week := COALESCE(p_week_of, date_trunc('week', CURRENT_DATE)::DATE);

  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'chain_id', tc.id,
        'initial_prompt', tc.initial_prompt,
        'is_complete', tc.is_complete,
        'steps', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'step_number', ts.step_number,
              'step_type', ts.step_type,
              'user_id', ts.user_id,
              'username', p.username,
              'avatar_config', p.avatar_config,
              'content', ts.content,
              'drawing_url', ts.drawing_url,
              'submitted_at', ts.submitted_at
            ) ORDER BY ts.step_number
          )
          FROM telephone_steps ts
          LEFT JOIN profiles p ON p.id = ts.user_id
          WHERE ts.chain_id = tc.id
        )
      )
    )
    FROM telephone_chains tc
    WHERE tc.group_id = p_group_id
      AND tc.week_of = v_week
  );
END;
$$;
