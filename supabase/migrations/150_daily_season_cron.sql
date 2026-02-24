-- ============================================================
-- 150: Daily Season Auto-Finalization Cron
-- Runs daily at 4 AM EST (9 AM UTC) to auto-finalize
-- previous month's season winners for all groups.
-- During DST (Mar-Nov), this runs at 5 AM EDT.
-- ============================================================

-- Function that iterates all groups and finalizes last month's season
CREATE OR REPLACE FUNCTION auto_finalize_seasons()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group RECORD;
  v_last_month DATE;
BEGIN
  -- Only run during first 7 days of month (after that, already finalized)
  IF EXTRACT(DAY FROM now()) > 7 THEN
    RETURN;
  END IF;

  v_last_month := (date_trunc('month', now()) - interval '1 day')::date;
  v_last_month := date_trunc('month', v_last_month)::date;

  -- Iterate all active groups
  FOR v_group IN
    SELECT DISTINCT g.id
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE NOT EXISTS (
      SELECT 1 FROM season_winners sw
      WHERE sw.group_id = g.id AND sw.season_month = v_last_month
    )
  LOOP
    -- finalize_season is idempotent
    PERFORM finalize_season(v_group.id, v_last_month);
  END LOOP;
END;
$$;

-- Schedule daily at 9:00 UTC = 4:00 AM EST
SELECT cron.schedule(
  'daily-season-finalize',
  '0 9 * * *',
  'SELECT auto_finalize_seasons()'
);
