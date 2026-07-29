CREATE TABLE public.genius_ai_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.genius_ai_plans TO authenticated;
GRANT ALL ON public.genius_ai_plans TO service_role;
ALTER TABLE public.genius_ai_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own genius plan"
  ON public.genius_ai_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_genius_ai_plans_updated_at
  BEFORE UPDATE ON public.genius_ai_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.genius_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  turns_used integer NOT NULL DEFAULT 0,
  input_tokens bigint NOT NULL DEFAULT 0,
  output_tokens bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

GRANT SELECT ON public.genius_ai_usage TO authenticated;
GRANT ALL ON public.genius_ai_usage TO service_role;
ALTER TABLE public.genius_ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own genius usage"
  ON public.genius_ai_usage FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_genius_ai_usage_updated_at
  BEFORE UPDATE ON public.genius_ai_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.consume_genius_turn(
  _user_id uuid,
  _input_tokens bigint DEFAULT 0,
  _output_tokens bigint DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_limit integer;
  v_period date := date_trunc('month', now())::date;
  v_turns integer;
BEGIN
  SELECT plan INTO v_plan FROM public.genius_ai_plans
  WHERE user_id = _user_id AND status = 'active';
  v_plan := COALESCE(v_plan, 'free');

  v_limit := CASE v_plan
    WHEN 'starter' THEN 1000
    WHEN 'pro' THEN 5000
    WHEN 'enterprise' THEN 1000000
    ELSE 50
  END;

  SELECT turns_used INTO v_turns FROM public.genius_ai_usage
  WHERE user_id = _user_id AND period_start = v_period;
  v_turns := COALESCE(v_turns, 0);

  IF v_turns >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'plan', v_plan, 'limit', v_limit, 'turns_used', v_turns);
  END IF;

  INSERT INTO public.genius_ai_usage (user_id, period_start, turns_used, input_tokens, output_tokens)
  VALUES (_user_id, v_period, 1, GREATEST(_input_tokens, 0), GREATEST(_output_tokens, 0))
  ON CONFLICT (user_id, period_start) DO UPDATE SET
    turns_used = public.genius_ai_usage.turns_used + 1,
    input_tokens = public.genius_ai_usage.input_tokens + GREATEST(_input_tokens, 0),
    output_tokens = public.genius_ai_usage.output_tokens + GREATEST(_output_tokens, 0),
    updated_at = now()
  RETURNING turns_used INTO v_turns;

  RETURN jsonb_build_object('allowed', true, 'plan', v_plan, 'limit', v_limit, 'turns_used', v_turns);
END;
$$;