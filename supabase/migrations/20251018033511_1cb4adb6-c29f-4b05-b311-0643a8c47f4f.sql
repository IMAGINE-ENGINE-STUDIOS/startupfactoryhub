-- Create public job applications table for external applicants
CREATE TABLE IF NOT EXISTS public.public_job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_job_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public applications)
CREATE POLICY "Anyone can submit public job applications"
ON public.public_job_applications
FOR INSERT
WITH CHECK (true);

-- Only company owners can view/update applications for their jobs
CREATE POLICY "Company owners can view applications for their jobs"
ON public.public_job_applications
FOR SELECT
USING (
  job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can update applications for their jobs"
ON public.public_job_applications
FOR UPDATE
USING (
  job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Create public internship applications table
CREATE TABLE IF NOT EXISTS public.public_internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_internship_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public applications)
CREATE POLICY "Anyone can submit public internship applications"
ON public.public_internship_applications
FOR INSERT
WITH CHECK (true);

-- Only company owners can view/update applications for their internships
CREATE POLICY "Company owners can view applications for their internships"
ON public.public_internship_applications
FOR SELECT
USING (
  internship_id IN (
    SELECT i.id FROM public.internships i
    JOIN public.companies c ON i.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can update applications for their internships"
ON public.public_internship_applications
FOR UPDATE
USING (
  internship_id IN (
    SELECT i.id FROM public.internships i
    JOIN public.companies c ON i.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_public_job_applications_job_id ON public.public_job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_public_internship_applications_internship_id ON public.public_internship_applications(internship_id);

-- Add updated_at trigger
CREATE TRIGGER update_public_job_applications_updated_at
BEFORE UPDATE ON public.public_job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_internship_applications_updated_at
BEFORE UPDATE ON public.public_internship_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();