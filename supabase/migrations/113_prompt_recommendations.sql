-- Prompt Recommendations System
-- Users can recommend custom prompts for their group

CREATE TABLE IF NOT EXISTS prompt_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('text', 'photo', 'quiplash', 'multiple_choice')),
  prompt_text TEXT NOT NULL,
  options JSONB, -- For multiple_choice: ["option1", "option2", ...]
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_rec_group ON prompt_recommendations(group_id);
CREATE INDEX IF NOT EXISTS idx_prompt_rec_user ON prompt_recommendations(user_id);

-- RLS
ALTER TABLE prompt_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own recommendations
CREATE POLICY "Users can insert own recommendations"
  ON prompt_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view recommendations in groups they belong to
CREATE POLICY "Users can view group recommendations"
  ON prompt_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = prompt_recommendations.group_id
        AND gm.user_id = auth.uid()
    )
  );
