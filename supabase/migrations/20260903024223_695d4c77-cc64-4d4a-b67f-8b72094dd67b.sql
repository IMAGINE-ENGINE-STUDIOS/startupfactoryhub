UPDATE public.subscription_plan_config
SET yearly_price_cents = 500000,
    monthly_price_cents = 50000,
    stripe_yearly_price_id = 'price_1UBQaNK5N1RcUVuYg0edBdei',
    updated_at = now()
WHERE key = 'investor';