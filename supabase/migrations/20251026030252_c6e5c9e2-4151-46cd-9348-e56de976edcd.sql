-- Drop PDF editor related tables and objects
DROP TABLE IF EXISTS public.pdf_collaboration_cursors CASCADE;
DROP TABLE IF EXISTS public.pdf_operation_history CASCADE;
DROP TABLE IF EXISTS public.pdf_editing_sessions CASCADE;

-- Remove all objects from pdf-documents bucket first
DELETE FROM storage.objects WHERE bucket_id = 'pdf-documents';

-- Then remove pdf-documents storage bucket
DELETE FROM storage.buckets WHERE id = 'pdf-documents';