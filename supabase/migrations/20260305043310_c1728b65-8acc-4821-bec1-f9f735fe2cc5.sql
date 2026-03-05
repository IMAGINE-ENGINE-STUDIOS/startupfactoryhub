
-- Allow users to insert their own official_mentor_status row (needed when accepting an invite)
CREATE POLICY "Users can insert own status"
ON public.official_mentor_status
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
