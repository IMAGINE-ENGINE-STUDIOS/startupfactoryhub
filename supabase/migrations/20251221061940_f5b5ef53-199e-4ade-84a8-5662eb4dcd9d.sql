-- Drop and recreate the update policy with proper with_check
DROP POLICY IF EXISTS "Creators can update their rooms" ON public.live_rooms;

CREATE POLICY "Creators can update their rooms" 
ON public.live_rooms 
FOR UPDATE 
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);