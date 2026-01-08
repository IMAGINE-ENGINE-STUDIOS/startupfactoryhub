-- Allow admins to view ALL resources (including pending/unverified)
CREATE POLICY "Admins can view all resources"
ON public.resources
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));