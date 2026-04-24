-- Add placement_mode to ar_drops
ALTER TABLE public.ar_drops
ADD COLUMN IF NOT EXISTS placement_mode text NOT NULL DEFAULT 'static';

ALTER TABLE public.ar_drops
DROP CONSTRAINT IF EXISTS ar_drops_placement_mode_check;

ALTER TABLE public.ar_drops
ADD CONSTRAINT ar_drops_placement_mode_check
CHECK (placement_mode IN ('static','free'));

-- Allow any authenticated user to move a "free" drop (update lat/lon/altitude/rotation)
-- Owners and admins keep full control via existing policies.
DROP POLICY IF EXISTS "Anyone can move free drops" ON public.ar_drops;

CREATE POLICY "Anyone can move free drops"
ON public.ar_drops
FOR UPDATE
TO authenticated
USING (placement_mode = 'free')
WITH CHECK (placement_mode = 'free');