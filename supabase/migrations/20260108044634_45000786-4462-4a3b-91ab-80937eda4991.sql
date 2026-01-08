-- Phase 1: Remove duplicate/conflicting INSERT policies
DROP POLICY IF EXISTS "Authenticated users can create resources" ON public.resources;
DROP POLICY IF EXISTS "Authenticated users can submit resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;

-- Create a unified INSERT policy that handles both regular users and admins
CREATE POLICY "Users can submit resources for review"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (
  -- Regular users can only insert unverified resources with their user_id
  (is_verified = false AND author_id = auth.uid())
  OR
  -- Admins can insert any resource (including verified ones)
  public.has_role(auth.uid(), 'admin')
);