ALTER TABLE public.sign_documents
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_sign_documents_source_type ON public.sign_documents(source_type);