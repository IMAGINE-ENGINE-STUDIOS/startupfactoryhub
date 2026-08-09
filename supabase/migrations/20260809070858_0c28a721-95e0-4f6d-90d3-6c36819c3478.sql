ALTER TABLE public.partners_campaign_posts
  ADD COLUMN IF NOT EXISTS tracking_code text,
  ADD COLUMN IF NOT EXISTS tracking_url text;

ALTER TABLE public.mvp_campaign_posts
  ADD COLUMN IF NOT EXISTS tracking_code text,
  ADD COLUMN IF NOT EXISTS tracking_url text;

CREATE UNIQUE INDEX IF NOT EXISTS partners_campaign_posts_tracking_code_key
  ON public.partners_campaign_posts (tracking_code) WHERE tracking_code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mvp_campaign_posts_tracking_code_key
  ON public.mvp_campaign_posts (tracking_code) WHERE tracking_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.campaign_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code text NOT NULL,
  campaign text NOT NULL,
  source text,
  medium text,
  landing_path text,
  referrer text,
  visitor_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.campaign_link_clicks TO anon;
GRANT INSERT, SELECT ON public.campaign_link_clicks TO authenticated;
GRANT ALL ON public.campaign_link_clicks TO service_role;

ALTER TABLE public.campaign_link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a campaign click"
  ON public.campaign_link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read campaign clicks"
  ON public.campaign_link_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS campaign_link_clicks_code_idx
  ON public.campaign_link_clicks (tracking_code, created_at DESC);