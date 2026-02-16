-- =====================================================
-- Fireside Progress Tracking
-- Track how far each user gets through the fireside
-- Green = completed, Blue = started/partial, Red = never opened
-- =====================================================

CREATE TABLE IF NOT EXISTS fireside_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  max_prompt_index INT NOT NULL DEFAULT 0,
  total_prompts INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id, week_of)
);

CREATE INDEX IF NOT EXISTS idx_fireside_progress_group_week ON fireside_progress(group_id, week_of);

-- RLS
ALTER TABLE fireside_progress ENABLE ROW LEVEL SECURITY;

-- Group members can view progress for their group
CREATE POLICY "Group members view fireside progress" ON fireside_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = fireside_progress.group_id AND gm.user_id = auth.uid()
  )
);

-- Users can insert their own progress
CREATE POLICY "Users insert own fireside progress" ON fireside_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users update own fireside progress" ON fireside_progress
FOR UPDATE USING (auth.uid() = user_id);

-- Upsert function: update progress as user clicks through
CREATE OR REPLACE FUNCTION update_fireside_progress(
  p_group_id UUID,
  p_week_of DATE,
  p_prompt_index INT,
  p_total_prompts INT,
  p_completed BOOLEAN DEFAULT false
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO fireside_progress (user_id, group_id, week_of, max_prompt_index, total_prompts, completed, updated_at)
  VALUES (auth.uid(), p_group_id, p_week_of, p_prompt_index, p_total_prompts, p_completed, now())
  ON CONFLICT (user_id, group_id, week_of) DO UPDATE
  SET
    max_prompt_index = GREATEST(fireside_progress.max_prompt_index, EXCLUDED.max_prompt_index),
    total_prompts = EXCLUDED.total_prompts,
    completed = fireside_progress.completed OR EXCLUDED.completed,
    updated_at = now();
END;
$$;

-- Get all members' fireside progress for a group/week
CREATE OR REPLACE FUNCTION get_fireside_progress(p_group_id UUID, p_week_of DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', gm.user_id,
      'status', CASE
        WHEN fp.completed = true THEN 'completed'
        WHEN fp.id IS NOT NULL THEN 'partial'
        ELSE 'not_started'
      END
    )
  ) INTO v_result
  FROM group_members gm
  LEFT JOIN fireside_progress fp
    ON fp.user_id = gm.user_id
    AND fp.group_id = p_group_id
    AND fp.week_of = p_week_of
  WHERE gm.group_id = p_group_id;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
