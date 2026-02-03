-- =====================================================
-- REACTIONS, THREADED COMMENTS, AND INTERACTION METRICS
-- =====================================================

-- 1. Response Reactions (emoji reactions on Fireside)
CREATE TABLE IF NOT EXISTS response_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- The emoji character or key
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(response_id, user_id) -- One reaction per user per response
);

CREATE INDEX IF NOT EXISTS idx_response_reactions_response ON response_reactions(response_id);
CREATE INDEX IF NOT EXISTS idx_response_reactions_user ON response_reactions(user_id);

-- 2. User emoji preferences (customizable reaction emojis)
CREATE TABLE IF NOT EXISTS user_emoji_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji_slot_1 TEXT DEFAULT '❤️',
  emoji_slot_2 TEXT DEFAULT '😂',
  emoji_slot_3 TEXT DEFAULT '🔥',
  emoji_slot_4 TEXT DEFAULT '😮',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Comment replies (threaded comments)
ALTER TABLE fireside_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES fireside_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_fireside_comments_parent ON fireside_comments(parent_comment_id);

-- 4. Interaction metrics tracking
CREATE TABLE IF NOT EXISTS interaction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  group_prompt_id UUID REFERENCES group_prompts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'view_end', 'reaction', 'comment', 'tap'
  duration_ms INTEGER, -- For view events, how long they looked
  metadata JSONB, -- Additional data like scroll position, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interaction_metrics_response ON interaction_metrics(response_id);
CREATE INDEX IF NOT EXISTS idx_interaction_metrics_user ON interaction_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_metrics_type ON interaction_metrics(event_type);

-- 5. Add voice and video prompt types support
-- (prompts table already has 'type' column, just need to ensure responses can store media)
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS media_type TEXT; -- 'photo', 'voice', 'video'

-- 6. RLS Policies
ALTER TABLE response_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_emoji_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_metrics ENABLE ROW LEVEL SECURITY;

-- Reactions policies
DROP POLICY IF EXISTS "Users can view reactions in their groups" ON response_reactions;
CREATE POLICY "Users can view reactions in their groups" ON response_reactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM responses r
    JOIN group_prompts gp ON gp.id = r.group_prompt_id
    JOIN group_members gm ON gm.group_id = gp.group_id
    WHERE r.id = response_reactions.response_id AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can add reactions" ON response_reactions;
CREATE POLICY "Users can add reactions" ON response_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reactions" ON response_reactions;
CREATE POLICY "Users can update own reactions" ON response_reactions
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON response_reactions;
CREATE POLICY "Users can delete own reactions" ON response_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Emoji preferences policies
DROP POLICY IF EXISTS "Users can manage own emoji preferences" ON user_emoji_preferences;
CREATE POLICY "Users can manage own emoji preferences" ON user_emoji_preferences
FOR ALL USING (auth.uid() = user_id);

-- Metrics policies (users can only insert their own)
DROP POLICY IF EXISTS "Users can insert own metrics" ON interaction_metrics;
CREATE POLICY "Users can insert own metrics" ON interaction_metrics
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own metrics" ON interaction_metrics;
CREATE POLICY "Users can view own metrics" ON interaction_metrics
FOR SELECT USING (auth.uid() = user_id);

-- 7. Helper functions

-- Get reactions for a response
CREATE OR REPLACE FUNCTION get_response_reactions(p_response_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reactions JSONB;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'emoji', emoji,
    'count', count,
    'users', users
  ))
  INTO v_reactions
  FROM (
    SELECT
      emoji,
      COUNT(*) as count,
      jsonb_agg(jsonb_build_object('user_id', user_id)) as users
    FROM response_reactions
    WHERE response_id = p_response_id
    GROUP BY emoji
  ) sub;

  RETURN COALESCE(v_reactions, '[]'::jsonb);
END;
$$;

-- Add or update reaction
CREATE OR REPLACE FUNCTION toggle_reaction(p_response_id UUID, p_emoji TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing UUID;
BEGIN
  -- Check if user already reacted with this emoji
  SELECT id INTO v_existing
  FROM response_reactions
  WHERE response_id = p_response_id AND user_id = auth.uid() AND emoji = p_emoji;

  IF v_existing IS NOT NULL THEN
    -- Remove reaction
    DELETE FROM response_reactions WHERE id = v_existing;
    RETURN jsonb_build_object('action', 'removed');
  ELSE
    -- Remove any existing reaction from this user on this response
    DELETE FROM response_reactions
    WHERE response_id = p_response_id AND user_id = auth.uid();

    -- Add new reaction
    INSERT INTO response_reactions (response_id, user_id, emoji)
    VALUES (p_response_id, auth.uid(), p_emoji);

    RETURN jsonb_build_object('action', 'added', 'emoji', p_emoji);
  END IF;
END;
$$;

-- Get user's emoji preferences
CREATE OR REPLACE FUNCTION get_user_emojis()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prefs RECORD;
BEGIN
  SELECT * INTO v_prefs FROM user_emoji_preferences WHERE user_id = auth.uid();

  IF v_prefs IS NULL THEN
    -- Return defaults
    RETURN jsonb_build_object(
      'emoji_slot_1', '❤️',
      'emoji_slot_2', '😂',
      'emoji_slot_3', '🔥',
      'emoji_slot_4', '😮'
    );
  END IF;

  RETURN jsonb_build_object(
    'emoji_slot_1', v_prefs.emoji_slot_1,
    'emoji_slot_2', v_prefs.emoji_slot_2,
    'emoji_slot_3', v_prefs.emoji_slot_3,
    'emoji_slot_4', v_prefs.emoji_slot_4
  );
END;
$$;

-- Update user's emoji preferences
CREATE OR REPLACE FUNCTION update_user_emojis(
  p_slot_1 TEXT DEFAULT NULL,
  p_slot_2 TEXT DEFAULT NULL,
  p_slot_3 TEXT DEFAULT NULL,
  p_slot_4 TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_emoji_preferences (user_id, emoji_slot_1, emoji_slot_2, emoji_slot_3, emoji_slot_4)
  VALUES (
    auth.uid(),
    COALESCE(p_slot_1, '❤️'),
    COALESCE(p_slot_2, '😂'),
    COALESCE(p_slot_3, '🔥'),
    COALESCE(p_slot_4, '😮')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    emoji_slot_1 = COALESCE(p_slot_1, user_emoji_preferences.emoji_slot_1),
    emoji_slot_2 = COALESCE(p_slot_2, user_emoji_preferences.emoji_slot_2),
    emoji_slot_3 = COALESCE(p_slot_3, user_emoji_preferences.emoji_slot_3),
    emoji_slot_4 = COALESCE(p_slot_4, user_emoji_preferences.emoji_slot_4),
    updated_at = now();

  RETURN get_user_emojis();
END;
$$;

-- Add comment reply (threaded)
CREATE OR REPLACE FUNCTION add_comment_reply(
  p_parent_comment_id UUID,
  p_content TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_parent RECORD;
  v_comment_id UUID;
BEGIN
  -- Get parent comment
  SELECT * INTO v_parent FROM fireside_comments WHERE id = p_parent_comment_id;

  IF v_parent IS NULL THEN
    RETURN jsonb_build_object('error', 'Parent comment not found');
  END IF;

  -- Insert reply
  INSERT INTO fireside_comments (response_id, user_id, content, parent_comment_id)
  VALUES (v_parent.response_id, auth.uid(), p_content, p_parent_comment_id)
  RETURNING id INTO v_comment_id;

  -- Update parent reply count
  UPDATE fireside_comments SET reply_count = reply_count + 1 WHERE id = p_parent_comment_id;

  RETURN jsonb_build_object(
    'success', true,
    'comment_id', v_comment_id
  );
END;
$$;

-- Get comments with replies for a response
CREATE OR REPLACE FUNCTION get_comments_with_replies(p_response_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_comments JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'content', c.content,
      'user_id', c.user_id,
      'username', p.username,
      'created_at', c.created_at,
      'reply_count', c.reply_count,
      'replies', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'content', r.content,
            'user_id', r.user_id,
            'username', rp.username,
            'created_at', r.created_at
          ) ORDER BY r.created_at ASC
        ), '[]'::jsonb)
        FROM fireside_comments r
        LEFT JOIN profiles rp ON rp.id = r.user_id
        WHERE r.parent_comment_id = c.id
      )
    ) ORDER BY c.created_at DESC
  )
  INTO v_comments
  FROM fireside_comments c
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.response_id = p_response_id AND c.parent_comment_id IS NULL;

  RETURN COALESCE(v_comments, '[]'::jsonb);
END;
$$;

-- Track interaction metric
CREATE OR REPLACE FUNCTION track_interaction(
  p_event_type TEXT,
  p_response_id UUID DEFAULT NULL,
  p_group_prompt_id UUID DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO interaction_metrics (user_id, response_id, group_prompt_id, event_type, duration_ms, metadata)
  VALUES (auth.uid(), p_response_id, p_group_prompt_id, p_event_type, p_duration_ms, p_metadata);
END;
$$;

-- Get interaction stats for a response (for determining "best" content)
CREATE OR REPLACE FUNCTION get_response_stats(p_response_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'view_count', COUNT(*) FILTER (WHERE event_type = 'view'),
    'total_view_time_ms', COALESCE(SUM(duration_ms) FILTER (WHERE event_type = 'view_end'), 0),
    'avg_view_time_ms', COALESCE(AVG(duration_ms) FILTER (WHERE event_type = 'view_end'), 0),
    'reaction_count', (SELECT COUNT(*) FROM response_reactions WHERE response_id = p_response_id),
    'comment_count', (SELECT COUNT(*) FROM fireside_comments WHERE response_id = p_response_id)
  )
  INTO v_stats
  FROM interaction_metrics
  WHERE response_id = p_response_id;

  RETURN v_stats;
END;
$$;
