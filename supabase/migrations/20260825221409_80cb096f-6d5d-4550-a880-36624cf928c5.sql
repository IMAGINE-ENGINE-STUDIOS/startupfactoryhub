-- Tracks LinkedIn <-> platform event synchronization (both directions)
CREATE TABLE public.event_linkedin_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('outbound','inbound')),
  linkedin_post_id text,
  linkedin_event_urn text,
  post_text text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_linkedin_sync TO authenticated;
GRANT ALL ON public.event_linkedin_sync TO service_role;

ALTER TABLE public.event_linkedin_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read event sync log"
ON public.event_linkedin_sync
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_event_linkedin_sync_event ON public.event_linkedin_sync(event_id);
CREATE INDEX idx_event_linkedin_sync_created ON public.event_linkedin_sync(created_at DESC);

CREATE TRIGGER trg_event_linkedin_sync_updated
BEFORE UPDATE ON public.event_linkedin_sync
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Settings for the events auto-sync campaign
CREATE TABLE public.event_sync_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  outbound_enabled boolean NOT NULL DEFAULT true,
  inbound_enabled boolean NOT NULL DEFAULT true,
  min_hours_between_posts integer NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.event_sync_settings TO authenticated;
GRANT ALL ON public.event_sync_settings TO service_role;

ALTER TABLE public.event_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read event sync settings"
ON public.event_sync_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event sync settings"
ON public.event_sync_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_event_sync_settings_updated
BEFORE UPDATE ON public.event_sync_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.event_sync_settings DEFAULT VALUES;