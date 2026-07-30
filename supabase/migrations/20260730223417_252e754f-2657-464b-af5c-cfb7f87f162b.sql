CREATE TABLE public.weekly_funding_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  startup_name TEXT,
  amount_text TEXT,
  round_type TEXT,
  investors TEXT,
  summary TEXT,
  image_url TEXT,
  source_site TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  week_of DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.weekly_funding_news TO authenticated;
GRANT ALL ON public.weekly_funding_news TO service_role;

ALTER TABLE public.weekly_funding_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read funding news"
ON public.weekly_funding_news FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_weekly_funding_news_updated_at
BEFORE UPDATE ON public.weekly_funding_news
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_weekly_funding_news_week ON public.weekly_funding_news (week_of DESC);

CREATE TABLE public.newsletter_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  html_snapshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

GRANT SELECT ON public.newsletter_sends TO authenticated;
GRANT ALL ON public.newsletter_sends TO service_role;

ALTER TABLE public.newsletter_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read newsletter sends"
ON public.newsletter_sends FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_newsletter_sends_updated_at
BEFORE UPDATE ON public.newsletter_sends
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles_data
  ADD COLUMN IF NOT EXISTS newsletter_opt_out BOOLEAN NOT NULL DEFAULT false;