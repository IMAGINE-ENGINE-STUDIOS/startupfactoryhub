-- Add policy to allow investors to create pitch meetings
CREATE POLICY "Investors can create pitch meetings" 
ON public.pitch_meetings 
FOR INSERT 
WITH CHECK (auth.uid() = investor_id);

-- Also ensure investors can update meetings they're part of
DROP POLICY IF EXISTS "Users can update their own pitch meetings" ON public.pitch_meetings;

CREATE POLICY "Users can update pitch meetings they're part of" 
ON public.pitch_meetings 
FOR UPDATE 
USING (auth.uid() = startup_id OR auth.uid() = investor_id);