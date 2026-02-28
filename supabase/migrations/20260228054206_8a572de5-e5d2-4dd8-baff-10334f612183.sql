
-- Drop the overly permissive service role policy (service role bypasses RLS anyway)
DROP POLICY "Service role full access to linkedin tokens" ON public.linkedin_tokens;
