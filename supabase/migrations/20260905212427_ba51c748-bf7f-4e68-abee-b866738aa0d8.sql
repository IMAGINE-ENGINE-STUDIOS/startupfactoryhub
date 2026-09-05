CREATE POLICY "Owners can remove signatures on their documents"
ON public.sign_signatures FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.sign_documents d WHERE d.id = sign_signatures.document_id AND d.owner_id = auth.uid()));

GRANT DELETE ON public.sign_signatures TO authenticated;