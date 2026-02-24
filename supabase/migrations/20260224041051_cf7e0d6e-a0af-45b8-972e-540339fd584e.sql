
-- Schedule daily activity digest at 7:00 AM EST (12:00 UTC)
SELECT cron.schedule(
  'daily-activity-digest',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/daily-activity-digest',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaWloaG1kc2Rnd2Rjd21yeXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTAyMDcsImV4cCI6MjA3Mzk4NjIwN30.ppEJAvP7mVrX-6uXA1_AlaJEDHPBcb297irRyBBT3YI"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
