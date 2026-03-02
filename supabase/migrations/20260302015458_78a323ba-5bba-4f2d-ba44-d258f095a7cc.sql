
-- Restore the SFH MVP Accelerator profile under demo-admin
INSERT INTO public.accelerator_profiles (
  id, user_id, organization_name, description, website, external_link,
  program_duration, equity_percentage, funding_offered,
  is_accepting_applications, location, total_cohorts, total_startups_supported,
  logo_url, industries_focus
) VALUES (
  'abd41d15-f707-4e36-b2f5-3a08d7b7b13a',
  'fcc1956e-8302-4348-91da-3014dd5069dc',
  'SFH - MVP Accelerator',
  'A 4-week intensive program that transforms your startup idea into a market-ready MVP. Get funding, mentorship, and a global network to launch faster.',
  'https://startupfactoryhub.lovable.app',
  'https://startupfactoryhub.lovable.app/mvp-program',
  '4 weeks',
  5,
  50000,
  true,
  'Global (Remote)',
  0,
  0,
  NULL,
  ARRAY['Technology', 'Healthcare', 'FinTech', 'EdTech', 'AI/ML']
) ON CONFLICT (id) DO NOTHING;

-- Restore an initial open cohort
INSERT INTO public.accelerator_cohorts (
  accelerator_id, name, description, start_date, end_date,
  application_deadline, max_startups, current_startups,
  funding_per_startup, equity_percentage, focus_industries,
  enrollment_fee, status, payment_type
) VALUES (
  'abd41d15-f707-4e36-b2f5-3a08d7b7b13a',
  'Cohort 1 - 2026',
  'Our inaugural cohort for early-stage startups ready to build and launch their MVP in 4 weeks.',
  '2026-04-01',
  '2026-04-28',
  '2026-03-25',
  10,
  0,
  50000,
  5,
  ARRAY['Technology', 'Healthcare', 'FinTech', 'EdTech', 'AI/ML'],
  150000,
  'applications_open',
  'one_time'
);
