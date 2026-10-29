CREATE TABLE public.socialite_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['read','write','send'],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.socialite_api_keys TO authenticated;
GRANT ALL ON public.socialite_api_keys TO service_role;
ALTER TABLE public.socialite_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own api keys" ON public.socialite_api_keys FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners delete own api keys" ON public.socialite_api_keys FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX socialite_api_keys_owner_idx ON public.socialite_api_keys(owner_id);

CREATE TABLE public.socialite_api_requests (
  id bigserial PRIMARY KEY,
  key_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  status int NOT NULL,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.socialite_api_requests TO authenticated;
GRANT ALL ON public.socialite_api_requests TO service_role;
GRANT USAGE ON SEQUENCE public.socialite_api_requests_id_seq TO service_role;
ALTER TABLE public.socialite_api_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own api requests" ON public.socialite_api_requests FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE INDEX socialite_api_requests_key_time_idx ON public.socialite_api_requests(key_id, created_at DESC);
CREATE INDEX socialite_api_requests_owner_time_idx ON public.socialite_api_requests(owner_id, created_at DESC);