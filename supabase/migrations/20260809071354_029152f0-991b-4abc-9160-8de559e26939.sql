ALTER TABLE public.partners_campaign_settings
  ADD COLUMN IF NOT EXISTS dedupe_lookback_posts integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS dedupe_window_days integer NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS similarity_threshold numeric NOT NULL DEFAULT 0.62;

ALTER TABLE public.mvp_campaign_settings
  ADD COLUMN IF NOT EXISTS dedupe_lookback_posts integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS dedupe_window_days integer NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS similarity_threshold numeric NOT NULL DEFAULT 0.62;