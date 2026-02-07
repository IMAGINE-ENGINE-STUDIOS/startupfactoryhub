
-- Create hub_applications table for Chapter Leader / Hub Owner applications
CREATE TABLE public.hub_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  primary_role TEXT NOT NULL,
  years_experience TEXT NOT NULL,
  ecosystem_strength TEXT NOT NULL,
  stakeholders TEXT[] DEFAULT '{}',
  estimated_startups TEXT NOT NULL,
  launch_timeline TEXT NOT NULL,
  team_status TEXT NOT NULL,
  primary_motivation TEXT NOT NULL,
  long_term_ambition TEXT NOT NULL,
  global_framework_readiness TEXT NOT NULL,
  leadership_style TEXT NOT NULL,
  greatest_strength TEXT NOT NULL,
  onboarding_timeline TEXT NOT NULL,
  three_year_commitment TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hub_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (public form)
CREATE POLICY "Anyone can submit hub applications"
ON public.hub_applications FOR INSERT
WITH CHECK (true);

-- Only admins can read applications
CREATE POLICY "Admins can read hub applications"
ON public.hub_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update applications
CREATE POLICY "Admins can update hub applications"
ON public.hub_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete applications
CREATE POLICY "Admins can delete hub applications"
ON public.hub_applications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_hub_applications_updated_at
BEFORE UPDATE ON public.hub_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
