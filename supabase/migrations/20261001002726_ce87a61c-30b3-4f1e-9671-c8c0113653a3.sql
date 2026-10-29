CREATE TABLE public.socialite_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'note' CHECK (kind IN ('face','scenario','wording','prohibited_words','prohibited_imagery','pitch','logic','pipeline','note')),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  content text NOT NULL DEFAULT '' CHECK (length(content) <= 8000),
  image_path text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX socialite_knowledge_owner_idx ON public.socialite_knowledge(owner_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.socialite_knowledge TO authenticated;
GRANT ALL ON public.socialite_knowledge TO service_role;
ALTER TABLE public.socialite_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own knowledge" ON public.socialite_knowledge FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE TRIGGER socialite_knowledge_touch BEFORE UPDATE ON public.socialite_knowledge FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Own knowledge files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'socialite-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own knowledge files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'socialite-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own knowledge files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'socialite-knowledge' AND (storage.foldername(name))[1] = auth.uid()::text);