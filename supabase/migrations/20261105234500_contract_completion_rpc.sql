-- Company completion of an Accelerator Program Participation Agreement that
-- was sent blank (founder flow, 2026-11-05): SFH emails the signing link,
-- the company itself fills in the custom terms (company name, IES Equity
-- Percentage, total raised, and the rest of Schedule A), and the completed
-- document replaces the blank one BEFORE anyone signs. Guarded to
-- equity_contract documents with no signatures yet; the completed HTML must
-- still carry its embedded terms record; the completion is written to the
-- document's activity ledger like any other edit.
CREATE OR REPLACE FUNCTION public.complete_sign_contract_by_token(
  _token text, _content_html text, _editor_name text, _editor_email text DEFAULT NULL
)
RETURNS timestamptz
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _doc public.sign_documents%ROWTYPE;
  _delta integer;
BEGIN
  IF length(coalesce(_editor_name,'')) < 2 THEN
    RAISE EXCEPTION 'Your name is required';
  END IF;
  IF length(coalesce(_content_html,'')) > 4000000 THEN
    RAISE EXCEPTION 'Content too large';
  END IF;
  IF _content_html NOT LIKE '%SFH_CONTRACT_VALUES:%' THEN
    RAISE EXCEPTION 'Completed contract is missing its terms record';
  END IF;

  SELECT * INTO _doc FROM public.sign_documents d
  WHERE d.share_token = _token;

  IF _doc.id IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  IF _doc.source_type <> 'equity_contract' THEN
    RAISE EXCEPTION 'This document cannot be completed this way';
  END IF;
  IF EXISTS (SELECT 1 FROM public.sign_signatures s WHERE s.document_id = _doc.id) THEN
    RAISE EXCEPTION 'This contract already has signatures and can no longer be changed';
  END IF;

  _delta := length(coalesce(_content_html,'')) - length(coalesce(_doc.content_html,''));

  UPDATE public.sign_documents
    SET content_html = _content_html, updated_at = now()
    WHERE id = _doc.id;

  INSERT INTO public.sign_document_edits (document_id, editor_name, editor_email, editor_id, action, summary, chars_delta)
  VALUES (_doc.id, _editor_name, lower(nullif(_editor_email,'')), auth.uid(), 'edit', 'Company completed its Schedule A terms', _delta);

  RETURN now();
END;
$$;

REVOKE ALL ON FUNCTION public.complete_sign_contract_by_token(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_sign_contract_by_token(text, text, text, text) TO anon, authenticated;
