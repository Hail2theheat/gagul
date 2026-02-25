-- ============================================================
-- 152: Notification Overhaul
--
-- Remove old hourly notification/reminder crons.
-- Add 4 targeted notification crons:
--   1. M-Sat 2 PM EST  → new prompt announcement (non-responders)
--   2. M-Sat 8:30 PM EST → prompt reminder (non-responders)
--   3. Sunday 12 PM EST → fireside open (all users)
--   4. Sunday 9 PM EST  → fireside reminder (non-viewers)
--
-- UTC conversions (EST = UTC-5):
--   2:00 PM EST  = 19:00 UTC
--   8:30 PM EST  = 01:30 UTC (+1 day)
--   12:00 PM EST = 17:00 UTC
--   9:00 PM EST  = 02:00 UTC (+1 day)
-- During EDT (Mar-Nov), these shift 1 hour earlier in ET.
-- ============================================================

-- Remove old crons
SELECT cron.unschedule('send-prompt-notifications');
SELECT cron.unschedule('send-prompt-reminders');

-- 1. M-Sat 2 PM EST = 19:00 UTC, Mon-Sat
SELECT cron.schedule(
  'notify-new-prompt',
  '0 19 * * 1-6',
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications',
    headers := '{}'::jsonb,
    body := '{"type": "new_prompt"}'::jsonb
  ) AS request_id;
  $$
);

-- 2. M-Sat 8:30 PM EST = 01:30 UTC next day (Tue-Sun in UTC)
SELECT cron.schedule(
  'notify-prompt-reminder',
  '30 1 * * 0,2-6',
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications',
    headers := '{}'::jsonb,
    body := '{"type": "prompt_reminder"}'::jsonb
  ) AS request_id;
  $$
);

-- 3. Sunday 12 PM EST = 17:00 UTC Sunday
SELECT cron.schedule(
  'notify-fireside-open',
  '0 17 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications',
    headers := '{}'::jsonb,
    body := '{"type": "fireside_open"}'::jsonb
  ) AS request_id;
  $$
);

-- 4. Sunday 9 PM EST = 02:00 UTC Monday
SELECT cron.schedule(
  'notify-fireside-reminder',
  '0 2 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications',
    headers := '{}'::jsonb,
    body := '{"type": "fireside_reminder"}'::jsonb
  ) AS request_id;
  $$
);
