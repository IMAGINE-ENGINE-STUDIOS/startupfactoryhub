-- Storage policies for pitch-decks bucket
-- Allow users to upload their own pitch decks
CREATE POLICY "Users can upload their pitch decks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pitch-decks' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own pitch decks
CREATE POLICY "Users can delete their pitch decks"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pitch-decks' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow investors, mentors, and advisors to view pitch decks
CREATE POLICY "Investors, mentors, and advisors can view pitch decks"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-decks' AND
  (
    public.has_role(auth.uid(), 'investor') OR
    public.has_role(auth.uid(), 'mentor') OR
    public.has_role(auth.uid(), 'advisor') OR
    (storage.foldername(name))[1] = auth.uid()::text
  )
);
