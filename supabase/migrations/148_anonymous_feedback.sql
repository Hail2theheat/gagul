-- Anonymous app feedback table
CREATE TABLE app_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),  -- stored for dedup but never exposed
  group_id UUID REFERENCES groups(id),   -- optional, set when from fireside
  week_of DATE,                          -- optional, set when from fireside
  content TEXT NOT NULL,
  screenshot_url TEXT,                   -- optional storage path
  source TEXT NOT NULL DEFAULT 'general', -- 'fireside' or 'general'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can insert their own, nobody can read others' feedback
ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON app_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own feedback"
  ON app_feedback FOR SELECT
  USING (auth.uid() = user_id);
