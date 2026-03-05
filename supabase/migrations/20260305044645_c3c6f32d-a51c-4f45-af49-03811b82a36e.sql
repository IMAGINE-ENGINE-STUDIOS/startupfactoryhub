-- Table for VC direct introduction requests
CREATE TABLE public.vc_introduction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  company_name text,
  industry text,
  arr_amount numeric,
  admin_notes text,
  vc_firm_name text,
  introduction_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vc_introduction_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own requests
CREATE POLICY "Users can read own vc requests"
ON public.vc_introduction_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own requests
CREATE POLICY "Users can insert own vc requests"
ON public.vc_introduction_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins full access vc requests"
ON public.vc_introduction_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
