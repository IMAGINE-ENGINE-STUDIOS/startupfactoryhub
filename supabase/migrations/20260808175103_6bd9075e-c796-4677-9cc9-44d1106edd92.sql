CREATE TABLE public.mvp_campaign_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  posted_at TIMESTAMP WITH TIME ZONE,
  days_left INTEGER,
  angle TEXT,
  post_text TEXT,
  banner_generated BOOLEAN NOT NULL DEFAULT false,
  linkedin_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mvp_campaign_posts TO authenticated;
GRANT ALL ON public.mvp_campaign_posts TO service_role;

ALTER TABLE public.mvp_campaign_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mvp campaign posts"
ON public.mvp_campaign_posts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mvp_campaign_posts_updated_at
BEFORE UPDATE ON public.mvp_campaign_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mvp_campaign_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  deadline DATE NOT NULL DEFAULT '2026-09-30',
  startups_per_batch INTEGER NOT NULL DEFAULT 20,
  apply_url TEXT NOT NULL DEFAULT 'https://startupfactoryhub.com/mvp-program?_build=2026-08-08T17%3A41%3A10.173Z',
  interval_days INTEGER NOT NULL DEFAULT 2,
  post_hour_local INTEGER NOT NULL DEFAULT 10,
  last_posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mvp_campaign_settings TO authenticated;
GRANT ALL ON public.mvp_campaign_settings TO service_role;

ALTER TABLE public.mvp_campaign_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage mvp campaign settings"
ON public.mvp_campaign_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mvp_campaign_settings_updated_at
BEFORE UPDATE ON public.mvp_campaign_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.mvp_campaign_settings (is_enabled) VALUES (true);