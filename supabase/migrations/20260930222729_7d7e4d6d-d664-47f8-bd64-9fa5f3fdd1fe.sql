CREATE TABLE public.socialite_credentials (
  platform text PRIMARY KEY,
  account_id text,
  extra_id text,
  token_cipher text NOT NULL,
  token_hint text,
  verified_name text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.socialite_credentials TO service_role;
ALTER TABLE public.socialite_credentials ENABLE ROW LEVEL SECURITY;
-- No policies and no grants for anon/authenticated: only the server (service role) can read or write keys.