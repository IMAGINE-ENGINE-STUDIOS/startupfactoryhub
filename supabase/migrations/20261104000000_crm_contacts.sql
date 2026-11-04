-- SFH Admin CRM — dedicated contacts table (future move, OPTIONAL).
-- Today the Admin CRM tab (src/components/admin/CrmManagement.tsx) reads
-- platform tables live (profiles, companies, investor_profiles,
-- accelerator_profiles, user_subscriptions) and stores external contacts
-- in the existing crm_cards table (tag 'sfh-external'), so nothing in
-- production depends on this table yet.
-- Run this in the Supabase dashboard when the CRM outgrows crm_cards:
-- it creates the dedicated table with the exact schema the Library CRM
-- Dashboard and the Admin CRM CSV export already use.
-- Migrations in this repo are versioning only; apply via the dashboard.

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text,
  type text NOT NULL DEFAULT 'External',
  stage text NOT NULL DEFAULT 'New Prospect',
  source text,
  last_contact date,
  reply_summary text,
  next_step text,
  score integer NOT NULL DEFAULT 0,
  profile_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_stage ON public.crm_contacts (stage);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON public.crm_contacts (type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts (lower(email));

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- Admin-only access, same has_role pattern the Admin panel already uses.
DROP POLICY IF EXISTS "Admins manage crm contacts" ON public.crm_contacts;
CREATE POLICY "Admins manage crm contacts"
  ON public.crm_contacts
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
