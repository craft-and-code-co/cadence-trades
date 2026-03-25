-- Daily insight analysis cron job.
--
-- Calls the analyze-data Edge Function at 5:00 AM UTC every day.
-- The Edge Function iterates all companies with onboarding_complete = true
-- and jobs count >= 30, computing metrics and generating AI insights.
--
-- PREREQUISITES:
--   pg_cron and pg_net extensions must be enabled (pg_cron created in 00001).
--   Supabase hosted projects include pg_net by default.
--
--   You must configure these app.settings in the Supabase dashboard:
--     ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<project-ref>.supabase.co';
--     ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';
--
--   These are database-level GUC variables. Set them via:
--     Supabase Dashboard > Project Settings > Database > Configuration
--   Or run the ALTER DATABASE commands above in the SQL Editor.

-- Ensure pg_net is available
create extension if not exists pg_net;

select cron.schedule(
  'daily-analyze',
  '0 5 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
