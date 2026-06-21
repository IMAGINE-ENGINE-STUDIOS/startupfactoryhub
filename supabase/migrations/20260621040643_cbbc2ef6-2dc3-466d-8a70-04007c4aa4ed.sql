
-- =========================================
-- integration_providers (catalog)
-- =========================================
CREATE TABLE public.integration_providers (
  id text PRIMARY KEY,
  name text NOT NULL,
  auth_type text NOT NULL CHECK (auth_type IN ('oauth2','oauth2_pkce','api_key')),
  icon_url text,
  default_scopes text[] NOT NULL DEFAULT '{}',
  docs_url text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integration_providers TO anon, authenticated;
GRANT ALL ON public.integration_providers TO service_role;

ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers are publicly readable"
  ON public.integration_providers FOR SELECT
  USING (true);

-- =========================================
-- user_integrations
-- =========================================
CREATE TABLE public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_id text NOT NULL REFERENCES public.integration_providers(id),
  account_label text,
  access_token text,         -- encrypted (AES-GCM, base64)
  refresh_token text,        -- encrypted
  expires_at timestamptz,
  scopes text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked','error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id, account_label)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
GRANT ALL ON public.user_integrations TO service_role;

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own integrations"
  ON public.user_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own integrations"
  ON public.user_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own integrations"
  ON public.user_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own integrations"
  ON public.user_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =========================================
-- integration_oauth_states (CSRF, short-lived)
-- =========================================
CREATE TABLE public.integration_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  provider_id text NOT NULL REFERENCES public.integration_providers(id),
  redirect_to text,
  pkce_verifier text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.integration_oauth_states TO authenticated;
GRANT ALL ON public.integration_oauth_states TO service_role;

ALTER TABLE public.integration_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own oauth state"
  ON public.integration_oauth_states FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own oauth state"
  ON public.integration_oauth_states FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own oauth state"
  ON public.integration_oauth_states FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =========================================
-- updated_at trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.tg_integrations_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.tg_integrations_set_updated_at();

CREATE TRIGGER trg_integration_providers_updated_at
  BEFORE UPDATE ON public.integration_providers
  FOR EACH ROW EXECUTE FUNCTION public.tg_integrations_set_updated_at();

-- =========================================
-- Seed providers
-- =========================================
INSERT INTO public.integration_providers (id, name, auth_type, default_scopes, docs_url) VALUES
  ('google_calendar', 'Google Calendar', 'oauth2',
    ARRAY['https://www.googleapis.com/auth/calendar.events','https://www.googleapis.com/auth/calendar.readonly','openid','email','profile'],
    'https://developers.google.com/calendar'),
  ('google_drive', 'Google Drive', 'oauth2',
    ARRAY['https://www.googleapis.com/auth/drive.file','https://www.googleapis.com/auth/drive.readonly','openid','email','profile'],
    'https://developers.google.com/drive'),
  ('slack', 'Slack', 'oauth2',
    ARRAY['chat:write','channels:read','users:read'],
    'https://api.slack.com/'),
  ('notion', 'Notion', 'oauth2',
    ARRAY[]::text[],
    'https://developers.notion.com/'),
  ('canva', 'Canva', 'oauth2_pkce',
    ARRAY['design:content:read','asset:read','profile:read'],
    'https://www.canva.dev/docs/connect/'),
  ('openai', 'ChatGPT (OpenAI)', 'api_key',
    ARRAY[]::text[],
    'https://platform.openai.com/api-keys')
ON CONFLICT (id) DO NOTHING;
