-- Add admin delete policy for accelerator_cohorts
CREATE POLICY "Admins can delete any cohort"
ON public.accelerator_cohorts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Also add admin policies for cohort_applications and cohort_startups deletions
-- (needed for cascading manual deletes from admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cohort_applications' AND policyname = 'Admins can delete any cohort application'
  ) THEN
    CREATE POLICY "Admins can delete any cohort application"
    ON public.cohort_applications
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'cohort_startups' AND policyname = 'Admins can delete any cohort startup'
  ) THEN
    CREATE POLICY "Admins can delete any cohort startup"
    ON public.cohort_startups
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;