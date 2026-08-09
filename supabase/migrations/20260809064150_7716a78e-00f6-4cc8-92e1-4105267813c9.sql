CREATE TABLE public.partners_campaign_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT true,
  landing_url text NOT NULL DEFAULT 'https://startupfactoryhub.com/forpartners',
  auto_publish_unreviewed boolean NOT NULL DEFAULT true,
  last_posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners_campaign_settings TO authenticated;
GRANT ALL ON public.partners_campaign_settings TO service_role;
ALTER TABLE public.partners_campaign_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partners campaign settings"
  ON public.partners_campaign_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.partners_campaign_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_text text,
  angle text,
  status text NOT NULL DEFAULT 'draft',
  generated_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz,
  posted_at timestamptz,
  linkedin_post_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners_campaign_posts TO authenticated;
GRANT ALL ON public.partners_campaign_posts TO service_role;
ALTER TABLE public.partners_campaign_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partners campaign posts"
  ON public.partners_campaign_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_partners_campaign_settings_updated_at
  BEFORE UPDATE ON public.partners_campaign_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partners_campaign_posts_updated_at
  BEFORE UPDATE ON public.partners_campaign_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.partners_campaign_settings (is_enabled) VALUES (true);