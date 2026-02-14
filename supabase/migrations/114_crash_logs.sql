-- Simple crash log table for debugging user-specific crashes
CREATE TABLE IF NOT EXISTS crash_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  screen TEXT,
  error_message TEXT,
  error_stack TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anyone can insert their own crash log
ALTER TABLE crash_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own crash logs"
  ON crash_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow reading all crash logs (for debugging)
CREATE POLICY "Anyone can read crash logs"
  ON crash_logs FOR SELECT
  USING (true);
