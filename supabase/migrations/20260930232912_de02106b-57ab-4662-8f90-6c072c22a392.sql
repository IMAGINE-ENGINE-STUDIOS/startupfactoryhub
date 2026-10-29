CREATE TABLE public.socialite_billing_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.socialite_billing_config TO anon, authenticated;
GRANT UPDATE, INSERT ON public.socialite_billing_config TO authenticated;
GRANT ALL ON public.socialite_billing_config TO service_role;
ALTER TABLE public.socialite_billing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads billing config" ON public.socialite_billing_config FOR SELECT USING (true);
CREATE POLICY "Main admin writes billing config" ON public.socialite_billing_config FOR ALL TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());
INSERT INTO public.socialite_billing_config (id, config) VALUES (1, '{
 "models":{"subscription":true,"pay_per_use":true,"credit_packs":true,"trial":true,"overage":true,"ai":true},
 "trial_days":7,"trial_plan":"pro",
 "credit_costs":{"post":1,"email":0.1,"sms":1,"whatsapp":1,"call":5,"ai_1k_tokens":1,"ai_image":5},
 "credit_packs":[{"id":"c100","name":"100 credits","credits":100,"price":10},{"id":"c500","name":"500 credits","credits":500,"price":40},{"id":"c2000","name":"2,000 credits","credits":2000,"price":120}],
 "ai":{"mode":"plan","flat_monthly":19}
}'::jsonb);

CREATE TABLE public.socialite_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  yearly_price numeric NOT NULL DEFAULT 0,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  features text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  sort int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.socialite_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.socialite_plans TO authenticated;
GRANT ALL ON public.socialite_plans TO service_role;
ALTER TABLE public.socialite_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads plans" ON public.socialite_plans FOR SELECT USING (true);
CREATE POLICY "Main admin manages plans" ON public.socialite_plans FOR ALL TO authenticated USING (public.is_main_admin()) WITH CHECK (public.is_main_admin());
INSERT INTO public.socialite_plans (id,name,monthly_price,yearly_price,limits,sort) VALUES
 ('creator','Creator',19,190,'{"posts":100,"email":1000,"sms":100,"whatsapp":100,"call":0,"ai_tokens":50000,"ai_image":20}',1),
 ('pro','Pro',49,490,'{"posts":500,"email":5000,"sms":500,"whatsapp":500,"call":50,"ai_tokens":250000,"ai_image":100}',2),
 ('agency','Agency',99,990,'{"posts":2000,"email":20000,"sms":2000,"whatsapp":2000,"call":200,"ai_tokens":1000000,"ai_image":400}',3);

CREATE TABLE public.socialite_subscriptions (
  user_id uuid PRIMARY KEY,
  plan_id text,
  status text NOT NULL DEFAULT 'none',
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  ai_addon boolean NOT NULL DEFAULT false,
  ai_addon_subscription_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.socialite_subscriptions TO authenticated;
GRANT ALL ON public.socialite_subscriptions TO service_role;
ALTER TABLE public.socialite_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin reads subscription" ON public.socialite_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_main_admin());

CREATE TABLE public.socialite_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  units numeric NOT NULL DEFAULT 1,
  credits numeric NOT NULL DEFAULT 0,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX socialite_usage_user_kind_time ON public.socialite_usage (user_id, kind, created_at DESC);
GRANT SELECT ON public.socialite_usage TO authenticated;
GRANT ALL ON public.socialite_usage TO service_role;
ALTER TABLE public.socialite_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin reads usage" ON public.socialite_usage FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_main_admin());

CREATE TABLE public.socialite_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta numeric NOT NULL,
  amount_usd numeric NOT NULL DEFAULT 0,
  reason text NOT NULL,
  stripe_session_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX socialite_credit_ledger_user ON public.socialite_credit_ledger (user_id, created_at DESC);
GRANT SELECT ON public.socialite_credit_ledger TO authenticated;
GRANT ALL ON public.socialite_credit_ledger TO service_role;
ALTER TABLE public.socialite_credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin reads ledger" ON public.socialite_credit_ledger FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_main_admin());

CREATE TABLE public.socialite_ai_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  provider text NOT NULL DEFAULT 'openai',
  base_url text,
  model text,
  image_model text,
  key_cipher text,
  key_hint text,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.socialite_ai_config TO service_role;
ALTER TABLE public.socialite_ai_config ENABLE ROW LEVEL SECURITY;