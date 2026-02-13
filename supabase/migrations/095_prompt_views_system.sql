-- =====================================================
-- Prompt Views: Track when users see a prompt
-- Status dots: red (not seen), blue (seen), green (answered)
-- Resets automatically per group_prompt (each new prompt)
-- =====================================================

-- Table to track when a user has viewed/seen a prompt
CREATE TABLE IF NOT EXISTS prompt_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_prompt_id UUID NOT NULL REFERENCES group_prompts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_views_group_prompt ON prompt_views(group_prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_views_user ON prompt_views(user_id);

-- RLS
ALTER TABLE prompt_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prompt views in their groups"
  ON prompt_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_prompts gp
      JOIN group_members gm ON gm.group_id = gp.group_id
      WHERE gp.id = prompt_views.group_prompt_id
        AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own prompt views"
  ON prompt_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to record that the current user has seen a prompt
CREATE OR REPLACE FUNCTION record_prompt_view(p_group_prompt_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO prompt_views (user_id, group_prompt_id)
  VALUES (auth.uid(), p_group_prompt_id)
  ON CONFLICT (user_id, group_prompt_id) DO NOTHING;
END;
$$;

-- Function to get all members' prompt statuses for the active prompt
-- Returns: user_id, status ('not_seen', 'seen', 'responded')
CREATE OR REPLACE FUNCTION get_member_prompt_statuses(p_group_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_active_gp_id UUID;
  v_result JSONB;
BEGIN
  -- Find the current active group_prompt
  SELECT gp.id INTO v_active_gp_id
  FROM group_prompts gp
  WHERE gp.group_id = p_group_id
    AND gp.scheduled_for <= now()
    AND gp.expires_at > now()
    AND gp.is_active = true
  ORDER BY gp.scheduled_for DESC
  LIMIT 1;

  -- If no active prompt, return empty array
  IF v_active_gp_id IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;

  -- Get status for each member
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', gm.user_id,
      'status', CASE
        WHEN r.id IS NOT NULL THEN 'responded'
        WHEN pv.id IS NOT NULL THEN 'seen'
        ELSE 'not_seen'
      END
    )
  ) INTO v_result
  FROM group_members gm
  LEFT JOIN responses r
    ON r.group_prompt_id = v_active_gp_id AND r.user_id = gm.user_id
  LEFT JOIN prompt_views pv
    ON pv.group_prompt_id = v_active_gp_id AND pv.user_id = gm.user_id
  WHERE gm.group_id = p_group_id;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;
