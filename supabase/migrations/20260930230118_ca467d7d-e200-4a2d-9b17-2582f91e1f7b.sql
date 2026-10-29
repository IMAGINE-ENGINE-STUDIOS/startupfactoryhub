DROP POLICY IF EXISTS "Users manage their own scheduled posts" ON public.socialite_scheduled;
CREATE POLICY "Users manage their own scheduled posts and contact sends" ON public.socialite_scheduled FOR ALL TO authenticated
  USING (created_by = auth.uid() AND kind IN ('post','contact')) WITH CHECK (created_by = auth.uid() AND kind IN ('post','contact'));