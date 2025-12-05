-- Create accelerator_resources table for private resources
CREATE TABLE public.accelerator_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accelerator_id UUID NOT NULL REFERENCES public.accelerator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'perk',
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  promo_code TEXT,
  discount_details TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create cohort_resource_access table for access control
CREATE TABLE public.cohort_resource_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.accelerator_resources(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES public.accelerator_cohorts(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID,
  UNIQUE(resource_id, cohort_id)
);

-- Enable RLS
ALTER TABLE public.accelerator_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_resource_access ENABLE ROW LEVEL SECURITY;

-- RLS for accelerator_resources
CREATE POLICY "Accelerators can manage their own resources"
ON public.accelerator_resources FOR ALL
USING (accelerator_id IN (
  SELECT id FROM public.accelerator_profiles WHERE user_id = auth.uid()
))
WITH CHECK (accelerator_id IN (
  SELECT id FROM public.accelerator_profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Startups can view resources they have access to"
ON public.accelerator_resources FOR SELECT
USING (
  id IN (
    SELECT cra.resource_id FROM public.cohort_resource_access cra
    JOIN public.cohort_startups cs ON cs.cohort_id = cra.cohort_id
    JOIN public.companies c ON c.id = cs.company_id
    WHERE c.user_id = auth.uid()
  )
);

-- RLS for cohort_resource_access
CREATE POLICY "Accelerators can manage access for their resources"
ON public.cohort_resource_access FOR ALL
USING (resource_id IN (
  SELECT ar.id FROM public.accelerator_resources ar
  JOIN public.accelerator_profiles ap ON ar.accelerator_id = ap.id
  WHERE ap.user_id = auth.uid()
))
WITH CHECK (resource_id IN (
  SELECT ar.id FROM public.accelerator_resources ar
  JOIN public.accelerator_profiles ap ON ar.accelerator_id = ap.id
  WHERE ap.user_id = auth.uid()
));

CREATE POLICY "Startups can view their cohort access"
ON public.cohort_resource_access FOR SELECT
USING (cohort_id IN (
  SELECT cs.cohort_id FROM public.cohort_startups cs
  JOIN public.companies c ON c.id = cs.company_id
  WHERE c.user_id = auth.uid()
));

-- Indexes for performance
CREATE INDEX idx_accelerator_resources_accelerator ON public.accelerator_resources(accelerator_id);
CREATE INDEX idx_cohort_resource_access_resource ON public.cohort_resource_access(resource_id);
CREATE INDEX idx_cohort_resource_access_cohort ON public.cohort_resource_access(cohort_id);