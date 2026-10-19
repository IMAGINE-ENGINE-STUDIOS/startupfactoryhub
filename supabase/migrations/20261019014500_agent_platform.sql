-- SFH Call Agents platform capabilities: agent sharing (public tokens) and a
-- per-user encrypted credential vault that browsing agents can use for
-- Basic-auth fetches. Decrypted secrets live only inside the call-agents
-- edge function — they are never logged, returned, or sent to the AI.

CREATE TABLE public.call_agent_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.call_agents(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.call_agent_shares TO authenticated;
GRANT ALL ON public.call_agent_shares TO service_role;
ALTER TABLE public.call_agent_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view own call agent shares" ON public.call_agent_shares FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners create own call agent shares" ON public.call_agent_shares FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own call agent shares" ON public.call_agent_shares FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX call_agent_shares_token_idx ON public.call_agent_shares(token);

CREATE TABLE public.user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  site_url text,
  username text,
  secret_ciphertext text NOT NULL,
  secret_iv text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_credentials TO authenticated;
GRANT ALL ON public.user_credentials TO service_role;
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own credentials" ON public.user_credentials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own credentials" ON public.user_credentials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own credentials" ON public.user_credentials FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own credentials" ON public.user_credentials FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX user_credentials_user_idx ON public.user_credentials(user_id);
CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE ON public.user_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
