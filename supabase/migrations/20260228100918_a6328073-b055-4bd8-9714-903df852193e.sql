
-- Create soft landing requests table
CREATE TABLE public.soft_landing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')),
  target_country TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_industry TEXT,
  company_website TEXT,
  company_description TEXT,
  business_registration_number TEXT,
  number_of_employees TEXT,
  annual_revenue TEXT,
  expansion_goals TEXT,
  additional_notes TEXT,
  admin_notes TEXT,
  is_corporate_subscriber BOOLEAN NOT NULL DEFAULT false,
  price_cents INTEGER NOT NULL DEFAULT 750000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.soft_landing_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own soft landing requests"
ON public.soft_landing_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own soft landing requests"
ON public.soft_landing_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all soft landing requests"
ON public.soft_landing_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all requests
CREATE POLICY "Admins can update all soft landing requests"
ON public.soft_landing_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_soft_landing_requests_updated_at
BEFORE UPDATE ON public.soft_landing_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
