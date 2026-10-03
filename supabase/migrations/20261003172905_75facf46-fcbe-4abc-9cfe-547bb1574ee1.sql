CREATE TABLE public.user_ai_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 100,
  bonus_claimed boolean NOT NULL DEFAULT true,
  last_daily_grant date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  plan text NOT NULL DEFAULT 'free',
  plan_credits_monthly integer NOT NULL DEFAULT 0,
  last_plan_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_ai_credits TO authenticated;
GRANT ALL ON public.user_ai_credits TO service_role;
ALTER TABLE public.user_ai_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own credits" ON public.user_ai_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_user_ai_credits_updated_at BEFORE UPDATE ON public.user_ai_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta numeric(12,2) NOT NULL,
  reason text NOT NULL,
  ref text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_credit_ledger TO authenticated;
GRANT ALL ON public.ai_credit_ledger TO service_role;
ALTER TABLE public.ai_credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ledger" ON public.ai_credit_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ai_credit_ledger_user_idx ON public.ai_credit_ledger(user_id, created_at DESC);

-- Ensures row exists and applies the 5/day grant. Returns current balance.
CREATE OR REPLACE FUNCTION public.ai_credits_sync(_user_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.user_ai_credits; today date := (now() AT TIME ZONE 'utc')::date;
BEGIN
  INSERT INTO public.user_ai_credits(user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  IF FOUND THEN
    INSERT INTO public.ai_credit_ledger(user_id, delta, reason, ref) VALUES (_user_id, 100, 'welcome', 'welcome:' || _user_id) ON CONFLICT DO NOTHING;
  END IF;
  SELECT * INTO r FROM public.user_ai_credits WHERE user_id = _user_id FOR UPDATE;
  IF r.last_daily_grant < today THEN
    UPDATE public.user_ai_credits SET balance = balance + 5, last_daily_grant = today WHERE user_id = _user_id RETURNING * INTO r;
    INSERT INTO public.ai_credit_ledger(user_id, delta, reason, ref) VALUES (_user_id, 5, 'daily', 'daily:' || _user_id || ':' || today) ON CONFLICT DO NOTHING;
  END IF;
  RETURN r.balance;
END $$;

-- Atomic deduction. Returns new balance, or -1 when insufficient.
CREATE OR REPLACE FUNCTION public.ai_credits_consume(_user_id uuid, _amount numeric, _reason text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b numeric;
BEGIN
  PERFORM public.ai_credits_sync(_user_id);
  UPDATE public.user_ai_credits SET balance = balance - _amount WHERE user_id = _user_id AND balance >= _amount RETURNING balance INTO b;
  IF b IS NULL THEN RETURN -1; END IF;
  INSERT INTO public.ai_credit_ledger(user_id, delta, reason) VALUES (_user_id, -_amount, _reason);
  RETURN b;
END $$;

-- Idempotent grant (plan renewals, purchases). Returns true if applied.
CREATE OR REPLACE FUNCTION public.ai_credits_grant(_user_id uuid, _amount numeric, _reason text, _ref text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ai_credits_sync(_user_id);
  INSERT INTO public.ai_credit_ledger(user_id, delta, reason, ref) VALUES (_user_id, _amount, _reason, _ref) ON CONFLICT (ref) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.user_ai_credits SET balance = balance + _amount WHERE user_id = _user_id;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.ai_credits_sync(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_credits_consume(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_credits_grant(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_credits_sync(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_credits_consume(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_credits_grant(uuid, numeric, text, text) TO service_role;