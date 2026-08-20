CREATE TABLE public.sign_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_type text NOT NULL DEFAULT 'html',
  project_id uuid,
  file_url text,
  content_html text,
  signer_message text,
  status text NOT NULL DEFAULT 'draft',
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sign_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.sign_documents(id) ON DELETE CASCADE,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signature_data text NOT NULL,
  note text,
  signed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sign_documents_owner ON public.sign_documents(owner_id);
CREATE INDEX idx_sign_signatures_doc ON public.sign_signatures(document_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sign_documents TO authenticated;
GRANT ALL ON public.sign_documents TO service_role;
GRANT SELECT ON public.sign_signatures TO authenticated;
GRANT ALL ON public.sign_signatures TO service_role;

ALTER TABLE public.sign_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sign_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their sign documents"
  ON public.sign_documents FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners view signatures on their documents"
  ON public.sign_signatures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sign_documents d WHERE d.id = document_id AND d.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sign_documents_updated_at
BEFORE UPDATE ON public.sign_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public read of a shared document by token (no owner PII exposed)
CREATE OR REPLACE FUNCTION public.get_sign_document_by_token(_token text)
RETURNS TABLE (
  id uuid, title text, source_type text, file_url text,
  content_html text, signer_message text, status text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.title, d.source_type, d.file_url, d.content_html,
         d.signer_message, d.status, d.created_at
  FROM public.sign_documents d
  WHERE d.share_token = _token AND d.status <> 'archived'
  LIMIT 1;
$$;

-- Public signature submission by token
CREATE OR REPLACE FUNCTION public.submit_sign_signature(
  _token text, _signer_name text, _signer_email text, _signature_data text, _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _doc_id uuid;
  _new_id uuid;
BEGIN
  IF length(coalesce(_signer_name,'')) < 2 OR _signer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid signer details';
  END IF;
  IF length(coalesce(_signature_data,'')) < 50 OR length(_signature_data) > 2000000 THEN
    RAISE EXCEPTION 'Invalid signature';
  END IF;

  SELECT d.id INTO _doc_id FROM public.sign_documents d
  WHERE d.share_token = _token AND d.status <> 'archived' LIMIT 1;

  IF _doc_id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  INSERT INTO public.sign_signatures (document_id, signer_name, signer_email, signature_data, note)
  VALUES (_doc_id, _signer_name, lower(_signer_email), _signature_data, _note)
  RETURNING id INTO _new_id;

  UPDATE public.sign_documents SET status = 'signed' WHERE id = _doc_id AND status <> 'signed';

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sign_document_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_sign_signature(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sign_document_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_sign_signature(text, text, text, text, text) TO anon, authenticated;