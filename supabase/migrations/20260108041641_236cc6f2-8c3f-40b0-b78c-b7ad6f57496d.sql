-- Phase 1: Fix Resource Type Constraint - Add 'event' to allowed types
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS check_resource_type;
ALTER TABLE public.resources ADD CONSTRAINT check_resource_type 
CHECK (resource_type IN (
  'office', 'lab', 'venue', 'perk', 'chamber_of_commerce', 
  'technology_transfer', 'community', 'government_grant', 
  'accelerator_incubator', 'entrepreneur_center', 'university', 
  'coworking', 'investor_network', 'human_capital', 'event', 'other'
));

-- Phase 2: Remove duplicate/conflicting SELECT policies
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;

-- Phase 3: Add Admin RLS Policies for full resource management

-- Allow admins to update any resource (for approve/edit)
DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;
CREATE POLICY "Admins can update resources"
ON public.resources
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any resource (for reject/delete)
DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;
CREATE POLICY "Admins can delete resources"
ON public.resources
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert resources (auto-verified)
DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
CREATE POLICY "Admins can insert resources"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));