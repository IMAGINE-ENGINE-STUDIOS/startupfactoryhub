-- SFH Call Agents: user-configured AI agents with coordination settings.
-- Agents are configured per user; runs are written by the call-agents edge
-- function (service role) and billed through the existing AI credits system
-- (user_ai_credits + ai_credit_ledger via ai_credits_consume/ai_credits_grant).

CREATE TABLE public.call_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  model text NOT NULL DEFAULT 'llama-3.3-70b-versatile',
  system_prompt text NOT NULL DEFAULT '',
  temperature numeric NOT NULL DEFAULT 0.7,
  max_tokens int NOT NULL DEFAULT 1024,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  coordination jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_agents TO authenticated;
GRANT ALL ON public.call_agents TO service_role;
ALTER TABLE public.call_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own call agents" ON public.call_agents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own call agents" ON public.call_agents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own call agents" ON public.call_agents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own call agents" ON public.call_agents FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX call_agents_user_idx ON public.call_agents(user_id, created_at DESC);
CREATE TRIGGER update_call_agents_updated_at BEFORE UPDATE ON public.call_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.call_agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.call_agents(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  input text,
  output text,
  prompt_tokens int,
  completion_tokens int,
  credits_charged numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.call_agent_runs TO authenticated;
GRANT ALL ON public.call_agent_runs TO service_role;
ALTER TABLE public.call_agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own call agent runs" ON public.call_agent_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX call_agent_runs_user_idx ON public.call_agent_runs(user_id, created_at DESC);
