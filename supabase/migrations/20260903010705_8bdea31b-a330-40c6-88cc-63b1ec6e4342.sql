CREATE TABLE public.subscription_plan_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  monthly_price_cents integer NOT NULL DEFAULT 5000,
  yearly_price_cents integer NOT NULL DEFAULT 48000,
  currency text NOT NULL DEFAULT 'usd',
  stripe_monthly_price_id text,
  stripe_yearly_price_id text,
  stripe_monthly_product_id text,
  stripe_yearly_product_id text,
  entitlements jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscription_plan_config TO anon;
GRANT SELECT ON public.subscription_plan_config TO authenticated;
GRANT ALL ON public.subscription_plan_config TO service_role;

ALTER TABLE public.subscription_plan_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON public.subscription_plan_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plan_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_subscription_plan_config_updated_at
  BEFORE UPDATE ON public.subscription_plan_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.subscription_plan_config (key, name, monthly_price_cents, yearly_price_cents, stripe_monthly_price_id, stripe_yearly_price_id, stripe_monthly_product_id, stripe_yearly_product_id, entitlements) VALUES (
  'basic', 'Basic Plan', 5000, 48000,
  'price_1UBP5CK5N1RcUVuYE6ZLPaqv', 'price_1UBP6kK5N1RcUVuYyxfwBHLw',
  'prod_VBmemZuuco0yOB', 'prod_VBmgE3TZ1f0O7F',
  '[
    {"key":"social_feed","label":"Social Feed Posting","description":"Post updates, milestones and announcements in the community feed","icon":"MessageSquare","actionLabel":"Create a post"},
    {"key":"resource_map","label":"Resource Map Posting","description":"Publish resources and locations on the global resource map","icon":"MapPin","actionLabel":"Add a resource"},
    {"key":"open_source_tech","label":"Open-Source Technologies","description":"Access the SFH open-source technology library","icon":"Code2","actionLabel":"Browse technologies"},
    {"key":"acceleration_programs","label":"Acceleration Programs","description":"Apply to SFH accelerator and MVP development programs","icon":"Rocket","actionLabel":"View programs"},
    {"key":"sfh_discounts","label":"SFH Services Discounts","description":"Member pricing on Startup Factory Hub services","icon":"Percent","actionLabel":"See discounts"},
    {"key":"events_access","label":"Meetings, Conferences & Pitch Events","description":"Access online and in-person meetings, conferences and pitch events","icon":"CalendarDays","actionLabel":"Browse events"},
    {"key":"investor_contact","label":"Investor Access","description":"Contact investors directly through the platform","icon":"HandCoins","actionLabel":"Find investors"},
    {"key":"internships","label":"Internships","description":"Access internship opportunities inside the SFH network","icon":"GraduationCap","actionLabel":"Browse internships"},
    {"key":"volunteering","label":"Volunteering Roles","description":"Join volunteering initiatives and community programs","icon":"HeartHandshake","actionLabel":"See roles"},
    {"key":"tech_transfer","label":"Technology Transfer","description":"Participate in technology transfer programs","icon":"ArrowLeftRight","actionLabel":"Explore transfers"},
    {"key":"certified_courses","label":"Certified Courses","description":"Enroll in certified courses and earn credentials","icon":"BadgeCheck","actionLabel":"Start learning"}
  ]'::jsonb
);