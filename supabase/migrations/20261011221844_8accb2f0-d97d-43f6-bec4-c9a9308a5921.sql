CREATE TABLE public.profile_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  body text,
  file_url text,
  position int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.profile_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'product',
  title text NOT NULL,
  description text,
  price_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  images text[] NOT NULL DEFAULT '{}',
  video_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.profile_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.profile_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.profile_listings(id) ON DELETE SET NULL,
  listing_title text NOT NULL,
  seller_id uuid NOT NULL,
  buyer_id uuid,
  buyer_email text,
  quantity int NOT NULL DEFAULT 1,
  amount_cents int NOT NULL,
  platform_fee_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profile_sections, public.profile_listings, public.profile_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_sections, public.profile_listings, public.profile_media TO authenticated;
GRANT SELECT ON public.profile_sales TO authenticated;
GRANT ALL ON public.profile_sections, public.profile_listings, public.profile_media, public.profile_sales TO service_role;

ALTER TABLE public.profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public sees visible sections" ON public.profile_sections FOR SELECT USING (visible OR user_id = auth.uid());
CREATE POLICY "Owner manages sections" ON public.profile_sections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public sees active listings" ON public.profile_listings FOR SELECT USING (active OR user_id = auth.uid());
CREATE POLICY "Owner manages listings" ON public.profile_listings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public sees media" ON public.profile_media FOR SELECT USING (true);
CREATE POLICY "Owner manages media" ON public.profile_media FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Seller, buyer or admin sees sales" ON public.profile_sales FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR buyer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER profile_sections_updated BEFORE UPDATE ON public.profile_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER profile_listings_updated BEFORE UPDATE ON public.profile_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX ON public.profile_sections (user_id, position);
CREATE INDEX ON public.profile_listings (user_id);
CREATE INDEX ON public.profile_media (user_id);
CREATE INDEX ON public.profile_sales (seller_id, created_at DESC);