-- Fix storage RLS policies for public-resumes bucket
DROP POLICY IF EXISTS "Authenticated users can read resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload resumes" ON storage.objects;

-- Allow authenticated users to read resumes from public-resumes bucket
CREATE POLICY "Authenticated users can read resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'public-resumes');

-- Allow anyone to upload resumes to public-resumes bucket
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'public-resumes');

-- Update bucket to be public for easier access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'public-resumes';