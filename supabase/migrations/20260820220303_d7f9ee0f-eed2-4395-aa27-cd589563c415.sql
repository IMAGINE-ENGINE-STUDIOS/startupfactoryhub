ALTER TABLE public.sign_documents
  ADD COLUMN IF NOT EXISTS access_mode text NOT NULL DEFAULT 'sign';

ALTER TABLE public.sign_documents
  DROP CONSTRAINT IF EXISTS sign_documents_access_mode_check;
ALTER TABLE public.sign_documents
  ADD CONSTRAINT sign_documents_access_mode_check CHECK (access_mode IN ('view','sign','edit'));

CREATE TABLE IF NOT EXISTS public.sign_document_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.sign_documents(id) ON DELETE CASCADE,
  editor_name text NOT NULL,
  editor_email text,
  editor_id uuid,
  action text NOT NULL DEFAULT 'edit',
  summary text,
  chars_delta integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sign_document_edits_doc ON public.sign_document_edits(document_id, created_at DESC);

GRANT SELECT ON public.sign_document_edits TO authenticated;
GRANT ALL ON public.sign_document_edits TO service_role;

ALTER TABLE public.sign_document_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view edit ledger" ON public.sign_document_edits;
CREATE POLICY "Owners view edit ledger"
  ON public.sign_document_edits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sign_documents d WHERE d.id = document_id AND d.owner_id = auth.uid()));

-- Extended token read: includes access mode and last update time
DROP FUNCTION IF EXISTS public.get_sign_document_by_token(text);
CREATE OR REPLACE FUNCTION public.get_sign_document_by_token(_token text)
RETURNS TABLE (
  id uuid, title text, source_type text, file_url text,
  content_html text, signer_message text, status text, created_at timestamptz,
  access_mode text, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.title, d.source_type, d.file_url, d.content_html,
         d.signer_message, d.status, d.created_at, d.access_mode, d.updated_at
  FROM public.sign_documents d
  WHERE d.share_token = _token AND d.status <> 'archived'
  LIMIT 1;
$$;

-- Public: signatures visible to everyone holding the link (no emails)
CREATE OR REPLACE FUNCTION public.get_sign_signatures_by_token(_token text)
RETURNS TABLE (id uuid, signer_name text, signature_data text, note text, signed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.signer_name, s.signature_data, s.note, s.signed_at
  FROM public.sign_signatures s
  JOIN public.sign_documents d ON d.id = s.document_id
  WHERE d.share_token = _token AND d.status <> 'archived'
  ORDER BY s.signed_at ASC;
$$;

-- Public: activity ledger (names only, no emails)
CREATE OR REPLACE FUNCTION public.get_sign_document_ledger(_token text)
RETURNS TABLE (id uuid, editor_name text, action text, summary text, chars_delta integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.id, e.editor_name, e.action, e.summary, e.chars_delta, e.created_at
  FROM public.sign_document_edits e
  JOIN public.sign_documents d ON d.id = e.document_id
  WHERE d.share_token = _token AND d.status <> 'archived'
  ORDER BY e.created_at DESC
  LIMIT 200;
$$;

-- Public collaborative save (only when the document is in 'edit' mode)
CREATE OR REPLACE FUNCTION public.save_sign_document_by_token(
  _token text, _content_html text, _editor_name text, _editor_email text DEFAULT NULL, _summary text DEFAULT NULL
)
RETURNS timestamptz
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _doc public.sign_documents%ROWTYPE;
  _delta integer;
BEGIN
  IF length(coalesce(_editor_name,'')) < 2 THEN
    RAISE EXCEPTION 'Editor name required';
  END IF;
  IF length(coalesce(_content_html,'')) > 4000000 THEN
    RAISE EXCEPTION 'Content too large';
  END IF;

  SELECT * INTO _doc FROM public.sign_documents d
  WHERE d.share_token = _token AND d.status <> 'archived' LIMIT 1;

  IF _doc.id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  IF _doc.access_mode <> 'edit' THEN
    RAISE EXCEPTION 'Document is not editable';
  END IF;

  _delta := length(coalesce(_content_html,'')) - length(coalesce(_doc.content_html,''));

  UPDATE public.sign_documents
    SET content_html = _content_html, updated_at = now()
    WHERE id = _doc.id;

  INSERT INTO public.sign_document_edits (document_id, editor_name, editor_email, editor_id, action, summary, chars_delta)
  VALUES (_doc.id, _editor_name, lower(nullif(_editor_email,'')), auth.uid(), 'edit', _summary, _delta);

  RETURN now();
END;
$$;

-- Log signatures in the ledger too
CREATE OR REPLACE FUNCTION public.submit_sign_signature(
  _token text, _signer_name text, _signer_email text, _signature_data text, _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _doc_id uuid;
  _mode text;
  _new_id uuid;
BEGIN
  IF length(coalesce(_signer_name,'')) < 2 OR _signer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid signer details';
  END IF;
  IF length(coalesce(_signature_data,'')) < 50 OR length(_signature_data) > 2000000 THEN
    RAISE EXCEPTION 'Invalid signature';
  END IF;

  SELECT d.id, d.access_mode INTO _doc_id, _mode FROM public.sign_documents d
  WHERE d.share_token = _token AND d.status <> 'archived' LIMIT 1;

  IF _doc_id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  IF _mode = 'view' THEN
    RAISE EXCEPTION 'Document is read only';
  END IF;

  INSERT INTO public.sign_signatures (document_id, signer_name, signer_email, signature_data, note)
  VALUES (_doc_id, _signer_name, lower(_signer_email), _signature_data, _note)
  RETURNING id INTO _new_id;

  INSERT INTO public.sign_document_edits (document_id, editor_name, editor_email, editor_id, action, summary)
  VALUES (_doc_id, _signer_name, lower(_signer_email), auth.uid(), 'sign', 'Firma registrada');

  UPDATE public.sign_documents SET status = 'signed' WHERE id = _doc_id AND status <> 'signed';

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sign_document_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_sign_signatures_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_sign_document_ledger(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_sign_document_by_token(text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_sign_signature(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sign_document_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sign_signatures_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sign_document_ledger(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_sign_document_by_token(text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_sign_signature(text, text, text, text, text) TO anon, authenticated;