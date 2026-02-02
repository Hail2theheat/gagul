-- Prompts System Migration
-- Run this in Supabase Dashboard (SQL Editor)

-- 1. Update prompts table to match PRD
ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS options JSONB,
  ADD COLUMN IF NOT EXISTS correct_answer TEXT,
  ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_user_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS thumbs_up INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thumbs_down INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0;

-- Migrate title to content
UPDATE prompts SET content = title WHERE content IS NULL AND title IS NOT NULL;

-- 2. Create group_prompts table
CREATE TABLE IF NOT EXISTS group_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  week_of DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_prompts_group_id ON group_prompts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_prompts_active ON group_prompts(group_id, is_active) WHERE is_active = true;

-- Migrate from prompt_instances (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompt_instances') THEN
    INSERT INTO group_prompts (id, group_id, prompt_id, scheduled_for, expires_at, week_of, is_active)
    SELECT id, group_id, prompt_id, starts_at,
      (starts_at::date + INTERVAL '1 day')::timestamptz,
      date_trunc('week', starts_at)::date, true
    FROM prompt_instances ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 3. Update responses table
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS group_prompt_id UUID REFERENCES group_prompts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS selected_option TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

-- Migrate prompt_instance_id to group_prompt_id (if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'responses' AND column_name = 'prompt_instance_id') THEN
    UPDATE responses SET group_prompt_id = prompt_instance_id WHERE group_prompt_id IS NULL;
  END IF;
END $$;

-- 4. Create prompt_ratings table
CREATE TABLE IF NOT EXISTS prompt_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(prompt_id, user_id)
);

-- 5. Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- 6. RLS Policies
ALTER TABLE group_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create
DROP POLICY IF EXISTS "Users view group prompts" ON group_prompts;
CREATE POLICY "Users view group prompts" ON group_prompts FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_prompts.group_id AND gm.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users rate prompts" ON prompt_ratings;
CREATE POLICY "Users rate prompts" ON prompt_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own ratings" ON prompt_ratings;
CREATE POLICY "Users view own ratings" ON prompt_ratings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own ratings" ON prompt_ratings;
CREATE POLICY "Users update own ratings" ON prompt_ratings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own tokens" ON push_tokens;
CREATE POLICY "Users manage own tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- 7. Updated get_group_status RPC
CREATE OR REPLACE FUNCTION get_group_status(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_active RECORD;
  v_response RECORD;
  v_rating RECORD;
BEGIN
  -- Get active prompt for this group
  SELECT gp.*, p.id as pid, p.type, p.content, p.title, p.options, p.correct_answer, p.category, p.payload
  INTO v_active
  FROM group_prompts gp JOIN prompts p ON p.id = gp.prompt_id
  WHERE gp.group_id = p_group_id AND gp.scheduled_for <= now() AND gp.expires_at > now() AND gp.is_active = true
  ORDER BY gp.scheduled_for DESC LIMIT 1;

  -- Check if user has responded and rated
  IF v_active.id IS NOT NULL THEN
    SELECT * INTO v_response FROM responses WHERE group_prompt_id = v_active.id AND user_id = auth.uid();
    SELECT * INTO v_rating FROM prompt_ratings WHERE prompt_id = v_active.pid AND user_id = auth.uid();
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'group_id', p_group_id,
    'active_prompt_instance', CASE WHEN v_active.id IS NOT NULL AND v_response.id IS NULL THEN jsonb_build_object(
      'id', v_active.id, 'prompt_id', v_active.pid, 'scheduled_for', v_active.scheduled_for,
      'expires_at', v_active.expires_at, 'week_of', v_active.week_of,
      'prompts', jsonb_build_object('id', v_active.pid, 'type', v_active.type, 'content', v_active.content,
        'title', v_active.title, 'options', v_active.options, 'correct_answer', v_active.correct_answer,
        'category', v_active.category, 'payload', v_active.payload)
    ) ELSE NULL END,
    'active_expires_at', v_active.expires_at,
    'has_responded', v_response.id IS NOT NULL,
    'has_rated', v_rating.id IS NOT NULL,
    'user_rating', v_rating.rating
  );
  RETURN v_result;
END;
$$;

-- 8. Submit rating RPC
CREATE OR REPLACE FUNCTION submit_prompt_rating(p_prompt_id UUID, p_rating BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prompt_ratings (prompt_id, user_id, rating) VALUES (p_prompt_id, auth.uid(), p_rating)
  ON CONFLICT (prompt_id, user_id) DO UPDATE SET rating = p_rating;
  UPDATE prompts SET
    thumbs_up = (SELECT COUNT(*) FROM prompt_ratings WHERE prompt_id = p_prompt_id AND rating = true),
    thumbs_down = (SELECT COUNT(*) FROM prompt_ratings WHERE prompt_id = p_prompt_id AND rating = false)
  WHERE id = p_prompt_id;
END;
$$;

-- 9. Seed test prompts
INSERT INTO prompts (id, type, content, title, category, options, is_active) VALUES
  (gen_random_uuid(), 'short_text', 'What is your current mood in 3 words?', 'Quick Mood', 'silly', NULL, true),
  (gen_random_uuid(), 'long_text', 'Describe your perfect day from morning to night.', 'Perfect Day', 'deep', NULL, true),
  (gen_random_uuid(), 'photo', 'Show us your view right now.', 'Your View', 'silly', NULL, true),
  (gen_random_uuid(), 'multiple_choice', 'Which superpower would you choose?', 'Superpower', 'interactive', '["Flight", "Invisibility", "Time Travel", "Telepathy"]'::jsonb, true),
  (gen_random_uuid(), 'quiplash', 'What would be the worst name for a cryptocurrency?', 'Bad Crypto', 'silly', NULL, true)
ON CONFLICT DO NOTHING;
