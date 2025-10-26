-- Drop all remaining PDF editor related tables
DROP TABLE IF EXISTS public.pdf_activities CASCADE;
DROP TABLE IF EXISTS public.pdf_notifications CASCADE;
DROP TABLE IF EXISTS public.pdf_versions CASCADE;
DROP TABLE IF EXISTS public.pdf_editor_signatures CASCADE;
DROP TABLE IF EXISTS public.pdf_signatures CASCADE;
DROP TABLE IF EXISTS public.document_collaborators CASCADE;
DROP TABLE IF EXISTS public.shared_pdf_documents CASCADE;