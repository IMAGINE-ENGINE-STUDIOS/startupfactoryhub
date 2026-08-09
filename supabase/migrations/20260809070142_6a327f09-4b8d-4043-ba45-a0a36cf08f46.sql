ALTER TABLE public.partners_campaign_settings
  ADD COLUMN IF NOT EXISTS post_days smallint[] NOT NULL DEFAULT ARRAY[1,3]::smallint[],
  ADD COLUMN IF NOT EXISTS post_hour_local integer NOT NULL DEFAULT 9;