
CREATE POLICY "Admins can insert cohorts"
ON public.accelerator_cohorts
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cohorts"
ON public.accelerator_cohorts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));
