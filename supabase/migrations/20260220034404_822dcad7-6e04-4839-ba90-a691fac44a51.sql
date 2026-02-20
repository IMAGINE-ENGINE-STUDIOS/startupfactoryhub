-- Allow admins to update any accelerator profile
CREATE POLICY "Admins can manage all accelerator profiles"
ON public.accelerator_profiles
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));