
-- Flight pass requests table for Frontier Airlines GoWild pass management
CREATE TABLE public.flight_pass_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  tier TEXT NOT NULL DEFAULT 'corporate',
  frontier_account_email TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flight_pass_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own flight pass requests"
ON public.flight_pass_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own flight pass requests"
ON public.flight_pass_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all flight pass requests"
ON public.flight_pass_requests FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Admins can update all requests
CREATE POLICY "Admins can update all flight pass requests"
ON public.flight_pass_requests FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Unique constraint: one request per user
ALTER TABLE public.flight_pass_requests ADD CONSTRAINT unique_user_flight_pass UNIQUE (user_id);

-- Trigger for updated_at
CREATE TRIGGER update_flight_pass_requests_updated_at
BEFORE UPDATE ON public.flight_pass_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
