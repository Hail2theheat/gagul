-- Schedule the reminder edge function to run every hour at minute 30
-- (offset from the main notification cron which runs at minute 0)
SELECT cron.schedule(
  'send-prompt-reminders',
  '30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-reminders',
    headers := '{}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
