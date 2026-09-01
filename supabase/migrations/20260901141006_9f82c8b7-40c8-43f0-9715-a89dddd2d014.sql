CREATE POLICY "Admins can view public cohort applications"
ON public.public_cohort_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update public cohort applications"
ON public.public_cohort_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.public_cohort_applications TO authenticated;
GRANT INSERT ON public.public_cohort_applications TO anon;
GRANT ALL ON public.public_cohort_applications TO service_role;