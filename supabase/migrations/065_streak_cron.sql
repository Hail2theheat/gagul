-- Schedule streak checker to run every hour (after prompts expire)
SELECT cron.schedule(
  'check-broken-streaks',
  '5 * * * *',  -- 5 minutes past each hour (after notifications at :00)
  $$
  SELECT check_and_break_streaks();
  $$
);
