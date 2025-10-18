-- ================================================
-- FIX PITCH DECK UPLOAD RLS POLICIES
-- ================================================

-- Drop broken policies
DROP POLICY IF EXISTS "Startup owners can upload their pitch deck" ON storage.objects;
DROP POLICY IF EXISTS "Startup owners can update their pitch deck" ON storage.objects;
DROP POLICY IF EXISTS "Startup owners can delete their pitch deck" ON storage.objects;
DROP POLICY IF EXISTS "Investors, mentors, and advisors can view pitch decks" ON storage.objects;

-- Create correct INSERT policy for pitch decks
CREATE POLICY "Startup owners can upload pitch deck"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pitch-decks' 
  AND auth.uid() IN (
    SELECT user_id FROM companies 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Create correct UPDATE policy
CREATE POLICY "Startup owners can update pitch deck"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pitch-decks' 
  AND auth.uid() IN (
    SELECT user_id FROM companies 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Create correct DELETE policy
CREATE POLICY "Startup owners can delete pitch deck"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pitch-decks' 
  AND auth.uid() IN (
    SELECT user_id FROM companies 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Create correct SELECT policy
CREATE POLICY "Users can view pitch decks"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pitch-decks' AND (
    -- Startup owner can see their own deck
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM companies WHERE user_id = auth.uid()
    )
    -- OR investors, mentors, advisors can see any deck
    OR has_role(auth.uid(), 'investor')
    OR has_role(auth.uid(), 'mentor')
    OR has_role(auth.uid(), 'advisor')
  )
);

-- ================================================
-- CREATE PUBLIC RESUMES BUCKET FOR JOB APPLICATIONS
-- ================================================

-- Create public-resumes bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-resumes',
  'public-resumes',
  false,
  10485760,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload public resumes
CREATE POLICY "Anyone can upload public resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'public-resumes');

-- Allow authenticated users to view public resumes
CREATE POLICY "Authenticated users can view public resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'public-resumes');

-- ================================================
-- FIX DOCUMENTS BUCKET RLS POLICIES
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);