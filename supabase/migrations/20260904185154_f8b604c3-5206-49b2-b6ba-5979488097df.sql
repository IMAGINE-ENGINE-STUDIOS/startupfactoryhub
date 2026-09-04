INSERT INTO public.accelerator_cohorts (
  accelerator_id,
  name,
  description,
  status,
  max_startups,
  current_startups,
  focus_industries,
  enrollment_fee,
  funding_per_startup,
  equity_percentage,
  payment_type,
  payment_duration_months,
  start_date,
  end_date,
  application_deadline
)
VALUES (
  'abd41d15-f707-4e36-b2f5-3a08d7b7b13a',
  'Accelerated Fundraising — Aerospace Hardware Batch 01',
  'A fundraising sprint for aerospace, defense and space hardware startups. Pitch architecture, technical diligence, active investor matching and a curated demo day.',
  'applications_open',
  20,
  0,
  ARRAY['aerospace', 'hardware', 'defense', 'space'],
  0,
  0,
  0,
  'one_time',
  0,
  NULL,
  NULL,
  NULL
);