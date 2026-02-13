-- Schedule notifications to run every hour
-- This uses pg_cron and pg_net extensions

-- Note: pg_cron and pg_net must be enabled in Supabase Dashboard > Database > Extensions

-- Schedule the function to run at the top of every hour
SELECT cron.schedule(
  'send-prompt-notifications',  -- job name
  '0 * * * *',                  -- every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://jssuzpodzgwfrpzmtpva.supabase.co/functions/v1/send-notifications',
    headers := '{}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To see job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- To unschedule:
-- SELECT cron.unschedule('send-prompt-notifications');
