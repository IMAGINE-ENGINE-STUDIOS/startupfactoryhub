-- Create corporate_partners table for partner applications
CREATE TABLE public.corporate_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  company_website TEXT,
  company_size TEXT,
  partnership_type TEXT NOT NULL,
  partnership_interests TEXT[],
  message TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corporate_partners ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a partnership application
CREATE POLICY "Anyone can submit partner applications"
ON public.corporate_partners
FOR INSERT
WITH CHECK (true);

-- Admins can manage all partner applications
CREATE POLICY "Admins can manage corporate_partners"
ON public.corporate_partners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view featured partners
CREATE POLICY "Anyone can view featured partners"
ON public.corporate_partners
FOR SELECT
USING (is_featured = true AND status = 'approved');

-- Add to realtime
ALTER TABLE public.corporate_partners REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.corporate_partners;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;