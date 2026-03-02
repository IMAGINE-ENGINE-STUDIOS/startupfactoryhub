-- Fix MVP Accelerator profile: no funding, software-focused industries
UPDATE public.accelerator_profiles
SET funding_offered = 0,
    industries_focus = ARRAY['SaaS', 'Software', 'AI/ML', 'FinTech', 'EdTech', 'Developer Tools']
WHERE id = 'abd41d15-f707-4e36-b2f5-3a08d7b7b13a';

-- Fix cohort: no funding per startup, software-focused industries
UPDATE public.accelerator_cohorts
SET funding_per_startup = 0,
    focus_industries = ARRAY['SaaS', 'Software', 'AI/ML', 'FinTech', 'EdTech', 'Developer Tools']
WHERE accelerator_id = 'abd41d15-f707-4e36-b2f5-3a08d7b7b13a';