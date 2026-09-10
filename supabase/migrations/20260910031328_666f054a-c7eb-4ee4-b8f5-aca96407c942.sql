ALTER TABLE public.sign_signatures ADD COLUMN IF NOT EXISTS field_index integer;

WITH ordered AS (
  SELECT id, (row_number() OVER (PARTITION BY document_id ORDER BY signed_at ASC) - 1) AS idx
  FROM public.sign_signatures
)
UPDATE public.sign_signatures s
SET field_index = o.idx
FROM ordered o
WHERE s.id = o.id AND s.field_index IS NULL;

DROP FUNCTION IF EXISTS public.get_sign_signatures_by_token(text);
CREATE OR REPLACE FUNCTION public.get_sign_signatures_by_token(_token text)
RETURNS TABLE (id uuid, signer_name text, signature_data text, note text, signed_at timestamptz, field_index integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.signer_name, s.signature_data, s.note, s.signed_at, s.field_index
  FROM public.sign_signatures s
  JOIN public.sign_documents d ON d.id = s.document_id
  WHERE d.share_token = _token AND d.status <> 'archived'
  ORDER BY s.signed_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.submit_sign_signature(
  _token text, _signer_name text, _signer_email text, _signature_data text, _note text DEFAULT NULL, _field_index integer DEFAULT NULL
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

  INSERT INTO public.sign_signatures (document_id, signer_name, signer_email, signature_data, note, field_index)
  VALUES (_doc_id, _signer_name, lower(_signer_email), _signature_data, _note, _field_index)
  RETURNING id INTO _new_id;

  INSERT INTO public.sign_document_edits (document_id, editor_name, editor_email, editor_id, action, summary)
  VALUES (_doc_id, _signer_name, lower(_signer_email), auth.uid(), 'sign', 'Firma registrada');

  UPDATE public.sign_documents SET status = 'signed' WHERE id = _doc_id AND status <> 'signed';

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sign_signatures_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_sign_signature(text, text, text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sign_signatures_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_sign_signature(text, text, text, text, text, integer) TO anon, authenticated;