-- Notification tracking to avoid duplicates
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_prompt_id UUID REFERENCES group_prompts(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT now(),
  tokens_notified INTEGER DEFAULT 0,
  UNIQUE(group_prompt_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_notification_log_prompt ON notification_log(group_prompt_id);

-- Function to get prompts that need notifications
-- (active, started in last 65 mins, not already notified)
CREATE OR REPLACE FUNCTION get_prompts_needing_notification()
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
  LEFT JOIN notification_log nl ON nl.group_prompt_id = gp.id
  WHERE gp.scheduled_for <= now()
    AND gp.scheduled_for >= now() - interval '65 minutes'
    AND gp.is_active = true
    AND gp.expires_at > now()
    AND nl.id IS NULL;  -- Not already notified
END;
$$;

-- Function to get push tokens for a group
CREATE OR REPLACE FUNCTION get_group_push_tokens(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  token TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT pt.user_id, pt.token
  FROM push_tokens pt
  JOIN group_members gm ON gm.user_id = pt.user_id
  WHERE gm.group_id = p_group_id;
END;
$$;

-- Function to mark prompt as notified
CREATE OR REPLACE FUNCTION mark_prompt_notified(p_group_prompt_id UUID, p_tokens_count INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notification_log (group_prompt_id, tokens_notified)
  VALUES (p_group_prompt_id, p_tokens_count)
  ON CONFLICT (group_prompt_id) DO NOTHING;
END;
$$;

-- Enable pg_cron if not already (requires superuser, run in dashboard SQL editor)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the edge function to run every hour
-- Run this in the Supabase Dashboard SQL Editor:
/*
SELECT cron.schedule(
  'send-prompt-notifications',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
*/
