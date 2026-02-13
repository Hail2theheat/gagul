-- Reminder notification system
-- Sends "Don't be that guy" nudge 5 hours after prompt goes live
-- to users who haven't responded yet.

-- Track which prompts have had reminders sent
CREATE TABLE IF NOT EXISTS reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_prompt_id UUID REFERENCES group_prompts(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  tokens_notified INTEGER DEFAULT 0,
  UNIQUE(group_prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_prompt ON reminder_log(group_prompt_id);

-- Find prompts that need a reminder:
-- scheduled_for was 5+ hours ago, still active/not expired, no reminder sent yet
CREATE OR REPLACE FUNCTION get_prompts_needing_reminder()
RETURNS TABLE (
  group_prompt_id UUID,
  group_id UUID,
  group_name TEXT,
  prompt_title TEXT,
  prompt_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    gp.id as group_prompt_id,
    gp.group_id,
    g.name as group_name,
    COALESCE(p.title, p.content, 'New prompt') as prompt_title,
    p.type as prompt_type
  FROM group_prompts gp
  JOIN prompts p ON p.id = gp.prompt_id
  JOIN groups g ON g.id = gp.group_id
  LEFT JOIN reminder_log rl ON rl.group_prompt_id = gp.id
  WHERE gp.scheduled_for + interval '5 hours' <= now()
    AND gp.is_active = true
    AND gp.expires_at > now()
    AND rl.id IS NULL;
END;
$$;

-- Get push tokens for group members who have NOT responded to a specific prompt
CREATE OR REPLACE FUNCTION get_non_responder_push_tokens(p_group_prompt_id UUID, p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  token TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT pt.user_id, pt.token
  FROM push_tokens pt
  JOIN group_members gm ON gm.user_id = pt.user_id AND gm.group_id = p_group_id
  WHERE NOT EXISTS (
    SELECT 1 FROM responses r
    WHERE r.group_prompt_id = p_group_prompt_id AND r.user_id = pt.user_id
  );
END;
$$;

-- Mark a prompt as reminded
CREATE OR REPLACE FUNCTION mark_prompt_reminded(p_group_prompt_id UUID, p_tokens_count INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO reminder_log (group_prompt_id, tokens_notified)
  VALUES (p_group_prompt_id, p_tokens_count)
  ON CONFLICT (group_prompt_id) DO NOTHING;
END;
$$;
