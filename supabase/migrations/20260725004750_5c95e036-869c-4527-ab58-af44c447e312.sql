
-- Marketing templates
CREATE TABLE public.marketing_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'startup_announcement',
  layout TEXT NOT NULL DEFAULT 'centered',
  background_type TEXT NOT NULL DEFAULT 'gradient',
  background_value TEXT NOT NULL DEFAULT 'from-primary via-purple-600 to-cyan-500',
  headline TEXT NOT NULL DEFAULT 'Welcome {startup_name} to Startup Factory Hub',
  subtext TEXT NOT NULL DEFAULT 'A new {industry} startup just joined our ecosystem',
  primary_color TEXT NOT NULL DEFAULT '#10b981',
  accent_color TEXT NOT NULL DEFAULT '#8b5cf6',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketing_templates TO authenticated;
GRANT ALL ON public.marketing_templates TO service_role;
ALTER TABLE public.marketing_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view templates" ON public.marketing_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage templates" ON public.marketing_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER marketing_templates_updated_at BEFORE UPDATE ON public.marketing_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- LinkedIn org tokens
CREATE TABLE public.linkedin_org_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_urn TEXT NOT NULL,
  org_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_org_tokens TO authenticated;
GRANT ALL ON public.linkedin_org_tokens TO service_role;
ALTER TABLE public.linkedin_org_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage org tokens" ON public.linkedin_org_tokens FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER linkedin_org_tokens_updated_at BEFORE UPDATE ON public.linkedin_org_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Marketing posts log
CREATE TABLE public.marketing_posts_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.marketing_templates(id) ON DELETE SET NULL,
  banner_url TEXT,
  linkedin_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketing_posts_log TO authenticated;
GRANT ALL ON public.marketing_posts_log TO service_role;
ALTER TABLE public.marketing_posts_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view marketing log" ON public.marketing_posts_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Track announced startups
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS announcement_posted_at TIMESTAMPTZ;

-- Trigger: fire when a startup profile becomes "complete"
CREATE OR REPLACE FUNCTION public.trigger_startup_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  service_key TEXT;
BEGIN
  -- Only fire if profile just became complete and not previously announced
  IF NEW.announcement_posted_at IS NULL
     AND NEW.logo_url IS NOT NULL AND NEW.logo_url != ''
     AND NEW.name IS NOT NULL AND NEW.name != ''
     AND NEW.description IS NOT NULL AND NEW.description != ''
     AND (
       TG_OP = 'INSERT'
       OR OLD.logo_url IS NULL OR OLD.logo_url = ''
       OR OLD.description IS NULL OR OLD.description = ''
     )
  THEN
    SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

    IF service_key IS NOT NULL THEN
      function_url := 'https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/announce-new-startup';
      PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
        body := jsonb_build_object('company_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trigger_startup_announcement failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_startup_profile_complete ON public.companies;
CREATE TRIGGER on_startup_profile_complete
AFTER INSERT OR UPDATE OF logo_url, name, description ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.trigger_startup_announcement();

-- Seed a default template
INSERT INTO public.marketing_templates (name, is_default) VALUES ('Default Startup Welcome', true);
