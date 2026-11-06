-- Startup engagement journey (founder order, 2026-11-06): every startup that
-- signs the Accelerator Program Participation Agreement is enrolled in an
-- email journey that keeps it engaged like a real accelerator cohort —
-- welcome, profile completion, perks, NVIDIA Inception, managing-partner
-- strategy session, weekly opportunities, weekly grants, a personalized
-- resource report, a daily Top 10, plus deck readiness, mentor match,
-- demo day and monthly investor-update steps.
--
-- One row per (recipient email, step, period). One-time steps use
-- period 'once'; recurring steps use a period key (ISO date for daily,
-- ISO week for weekly, YYYY-MM for monthly). The start-startup-journey
-- function enrolls a signer and sends the Welcome; engagement-tick sends
-- whatever is due. Service role only — RLS on, no public policies.
create table if not exists public.startup_engagement_queue (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.sign_documents(id) on delete set null,
  email text not null,
  company_name text,
  step text not null,
  period text not null default 'once',
  due_at timestamptz not null default now(),
  sent_at timestamptz,
  status text not null default 'pending',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists startup_engagement_queue_unique_step
  on public.startup_engagement_queue (email, step, period);

create index if not exists startup_engagement_queue_due
  on public.startup_engagement_queue (status, due_at);

alter table public.startup_engagement_queue enable row level security;
