-- ============================================================
-- Grants AS RESOURCES on the globe + matching inside the brain
-- ------------------------------------------------------------
-- Founder direction 2026-10-27, simplified same day:
--  * Grants are added to the globe AS RESOURCES — a pin in
--    public.resources with resource_type = 'government_grant'.
--    The grant money/deadline/eligibility data lives in grant_*
--    columns ON the resource row. No separate grants table,
--    no new interface, no new screens.
--  * The matching function lives in the EXISTING AI
--    recommendation feature behind the brain logo:
--    generate-recommendations calls match_startup_to_grants()
--    and returns unlocked grants as ordinary 'resource'
--    recommendations in the existing RecommendationPopup.
--    Genius (genius-agent / geniusActions) calls the same
--    function. One matcher, existing surfaces only.
--  * AUTO-UNLOCK: triggers on companies,
--    startup_journey_milestones and resources recompute
--    grant_matches the moment anything changes — a startup
--    finishes a profile field or a journey step, or a new
--    grant resource is verified. First unlock notifies the
--    founder in the existing notifications feed.
-- ============================================================

-- ---------- 1. Grant data on the resource row ----------
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS grant_amount_text          TEXT,
  ADD COLUMN IF NOT EXISTS grant_amount_max_usd       INTEGER,
  ADD COLUMN IF NOT EXISTS grant_deadline             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grant_is_rolling           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grant_status               TEXT
    CHECK (grant_status IN ('open','opening_soon','rolling','closed','watchlist')),
  ADD COLUMN IF NOT EXISTS grant_sfh_status           TEXT
    CHECK (grant_sfh_status IN ('applied','received','in_progress')),
  ADD COLUMN IF NOT EXISTS grant_sfh_applicant        TEXT,
  ADD COLUMN IF NOT EXISTS grant_eligibility_tags     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grant_industries           TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grant_applicant_types      TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grant_required_steps       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grant_women_owned_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grant_us_based_required    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grant_state_focus          TEXT,
  ADD COLUMN IF NOT EXISTS grant_country_focus        TEXT,
  ADD COLUMN IF NOT EXISTS grant_external_id          TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS grant_source_url           TEXT,
  ADD COLUMN IF NOT EXISTS grant_last_verified_at     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_resources_grants
  ON public.resources(grant_status, grant_deadline)
  WHERE resource_type = 'government_grant';

-- ---------- 2. Eligibility facts a startup may need to state ----------
-- Nullable on purpose: NULL = unknown, never treated as "no".
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tags              TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_women_owned    BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_minority_owned BOOLEAN,
  ADD COLUMN IF NOT EXISTS country           TEXT,
  ADD COLUMN IF NOT EXISTS state             TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT;

-- ---------- 3. Matches + unlock state ----------
CREATE TABLE IF NOT EXISTS public.grant_matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL DEFAULT 0,
  eligible    BOOLEAN NOT NULL DEFAULT false,
  unlocked    BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  reasons     JSONB NOT NULL DEFAULT '[]',
  missing     JSONB NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'suggested'
              CHECK (status IN ('suggested','seen','saved','applied','dismissed')),
  notified_at TIMESTAMPTZ,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, resource_id)
);
CREATE INDEX IF NOT EXISTS idx_grant_matches_company
  ON public.grant_matches(company_id, unlocked, score DESC);

ALTER TABLE public.grant_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Company owners see their grant matches" ON public.grant_matches;
CREATE POLICY "Company owners see their grant matches" ON public.grant_matches FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "Company owners update their grant match status" ON public.grant_matches;
CREATE POLICY "Company owners update their grant match status" ON public.grant_matches FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()));

-- ---------- 4. The matcher (the one function every surface calls) ----------
CREATE OR REPLACE FUNCTION public.company_journey_step(p_stage TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(coalesce(p_stage,''))
    WHEN 'idea' THEN 'idea' WHEN 'pre-seed' THEN 'research' WHEN 'preseed' THEN 'research'
    WHEN 'mvp' THEN 'mvp' WHEN 'prototype' THEN 'mvp' WHEN 'seed' THEN 'validation' WHEN 'launch' THEN 'launch'
    WHEN 'series a' THEN 'growth' WHEN 'series b' THEN 'growth' WHEN 'growth' THEN 'growth'
    ELSE 'idea' END;
$$;

CREATE OR REPLACE FUNCTION public.grant_blockers(p_company public.companies, p_resource public.resources)
RETURNS TEXT[] LANGUAGE plpgsql STABLE AS $$
DECLARE b TEXT[] := '{}';
BEGIN
  IF p_resource.grant_status = 'closed' THEN b := array_append(b, 'This grant is closed.'::text); END IF;
  IF p_resource.grant_deadline IS NOT NULL AND p_resource.grant_deadline < now()
     AND NOT p_resource.grant_is_rolling
     THEN b := array_append(b, 'The deadline has passed.'::text); END IF;
  IF p_resource.grant_women_owned_required AND p_company.is_women_owned IS DISTINCT FROM true
     THEN b := array_append(b, 'Requires a women-owned business (51%+). Add this to your company profile if it applies.'::text); END IF;
  IF p_resource.grant_us_based_required AND p_company.country IS NOT NULL
     AND lower(p_company.country) NOT IN ('united states','usa','us','estados unidos')
     THEN b := array_append(b, 'US-based companies only.'::text); END IF;
  IF p_resource.grant_state_focus IS NOT NULL AND p_company.state IS NOT NULL
     AND upper(p_company.state) <> upper(p_resource.grant_state_focus)
     THEN b := array_append(b, 'Only for companies in the grant''s focus state.'::text); END IF;
  IF coalesce(array_length(p_resource.grant_applicant_types,1),0) > 0
     AND NOT ('startup' = ANY(p_resource.grant_applicant_types))
     AND NOT ('any' = ANY(p_resource.grant_applicant_types))
     THEN b := array_append(b, 'Not open to startups directly (see who can apply).'::text); END IF;
  IF coalesce(array_length(p_resource.grant_required_steps,1),0) > 0
     AND NOT (public.company_journey_step(p_company.stage::text) = ANY(p_resource.grant_required_steps))
     AND NOT ('all' = ANY(p_resource.grant_required_steps))
     THEN b := array_append(b, ('Unlocks at the ' || array_to_string(p_resource.grant_required_steps, ' / ') || ' stage of your journey.')::text); END IF;
  RETURN b;
END $$;

-- Score 0..100: stage fit 30, industry fit 25, location fit 20,
-- eligibility tags 15, deadline/amount fit 10.
CREATE OR REPLACE FUNCTION public.score_grant_for_company(p_company public.companies, p_resource public.resources)
RETURNS TABLE(score INTEGER, reasons JSONB) LANGUAGE plpgsql STABLE AS $$
DECLARE s INTEGER := 0; r JSONB := '[]'::jsonb; step TEXT := public.company_journey_step(p_company.stage::text);
BEGIN
  IF p_resource.journey_steps IS NULL OR 'all' = ANY(p_resource.journey_steps) OR step = ANY(p_resource.journey_steps) THEN
    s := s + 30; r := r || to_jsonb(('Matches your current journey stage (' || step || ').')::text);
  ELSIF coalesce(array_length(p_resource.journey_steps,1),0) > 0 THEN
    s := s + 10; r := r || to_jsonb('Relevant to a nearby journey stage.'::text);
  END IF;
  IF coalesce(array_length(p_resource.grant_industries,1),0) = 0 THEN
    s := s + 20; r := r || to_jsonb('Open to all industries.'::text);
  ELSIF p_company.industry IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(p_resource.grant_industries) i WHERE lower(p_company.industry) LIKE '%' || lower(i) || '%') THEN
    s := s + 25; r := r || to_jsonb(('Matches your industry: ' || p_company.industry || '.')::text);
  END IF;
  IF p_resource.grant_state_focus IS NOT NULL AND p_company.state IS NOT NULL
     AND upper(p_company.state) = upper(p_resource.grant_state_focus) THEN
    s := s + 20; r := r || to_jsonb('Made for companies in your state.'::text);
  ELSIF p_resource.location_type = 'online' OR p_resource.grant_country_focus IS NULL THEN
    s := s + 16; r := r || to_jsonb('Available online / anywhere.'::text);
  ELSIF p_company.country IS NOT NULL AND p_resource.grant_country_focus IS NOT NULL
        AND lower(p_company.country) = lower(p_resource.grant_country_focus) THEN
    s := s + 14; r := r || to_jsonb('Open in your country.'::text);
  END IF;
  IF coalesce(array_length(p_resource.grant_eligibility_tags,1),0) > 0 AND p_company.tags IS NOT NULL THEN
    s := s + LEAST(15, 5 * (SELECT count(*) FROM unnest(p_resource.grant_eligibility_tags) t
                            WHERE lower(t) = ANY (SELECT lower(x) FROM unnest(p_company.tags) x)));
  END IF;
  IF p_resource.grant_women_owned_required AND p_company.is_women_owned THEN
    s := s + 10; r := r || to_jsonb('You qualify as a women-owned business.'::text);
  END IF;
  IF p_resource.grant_is_rolling OR p_resource.grant_deadline IS NULL THEN
    s := s + 7; r := r || to_jsonb('Rolling applications, no deadline pressure.'::text);
  ELSIF p_resource.grant_deadline > now() AND p_resource.grant_deadline < now() + interval '45 days' THEN
    s := s + 10; r := r || to_jsonb(('Deadline is close: ' || to_char(p_resource.grant_deadline,'Mon DD, YYYY') || '.')::text);
  ELSIF p_resource.grant_deadline > now() THEN
    s := s + 6;
  END IF;
  IF p_resource.grant_amount_max_usd IS NOT NULL AND p_resource.grant_amount_max_usd >= 10000 THEN s := s + 3; END IF;
  RETURN QUERY SELECT LEAST(100, s), r;
END $$;

CREATE OR REPLACE FUNCTION public.match_startup_to_grants(p_company_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(resource_id UUID, title TEXT, amount_text TEXT, amount_max_usd INTEGER,
              deadline TIMESTAMPTZ, is_rolling BOOLEAN, grant_status TEXT, website_url TEXT,
              city TEXT, country TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
              score INTEGER, eligible BOOLEAN, unlocked BOOLEAN, reasons JSONB, missing JSONB)
LANGUAGE sql STABLE AS $$
  SELECT r.id, r.title, r.grant_amount_text, r.grant_amount_max_usd, r.grant_deadline,
         r.grant_is_rolling, r.grant_status, r.website_url, r.city, r.country,
         r.latitude, r.longitude, sc.score,
         (cardinality(public.grant_blockers(c, r)) = 0),
         (cardinality(public.grant_blockers(c, r)) = 0 AND sc.score >= 60),
         sc.reasons, to_jsonb(public.grant_blockers(c, r))
  FROM public.companies c
  JOIN public.resources r
    ON r.resource_type = 'government_grant' AND r.is_verified = true
   AND r.grant_status IS DISTINCT FROM 'closed'
  CROSS JOIN LATERAL public.score_grant_for_company(c, r) sc
  WHERE c.id = p_company_id
  ORDER BY (cardinality(public.grant_blockers(c, r)) = 0 AND sc.score >= 60) DESC,
           sc.score DESC, r.grant_deadline ASC NULLS LAST
  LIMIT p_limit;
$$;

-- ---------- 5. AUTO-UNLOCK engine ----------
CREATE OR REPLACE FUNCTION public.recompute_grant_matches(p_company_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.companies; r public.resources; sc RECORD;
        blk TEXT[]; is_elig BOOLEAN; is_unl BOOLEAN; n INTEGER := 0; was_unl BOOLEAN;
BEGIN
  SELECT * INTO c FROM public.companies WHERE id = p_company_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  FOR r IN SELECT * FROM public.resources
           WHERE resource_type = 'government_grant' AND is_verified = true
             AND grant_status IS DISTINCT FROM 'closed' LOOP
    SELECT * INTO sc FROM public.score_grant_for_company(c, r);
    blk := public.grant_blockers(c, r);
    is_elig := cardinality(blk) = 0;
    is_unl := is_elig AND sc.score >= 60;
    SELECT unlocked INTO was_unl FROM public.grant_matches WHERE company_id = c.id AND resource_id = r.id;
    INSERT INTO public.grant_matches (company_id, resource_id, score, eligible, unlocked, unlocked_at, reasons, missing, computed_at)
    VALUES (c.id, r.id, sc.score, is_elig, is_unl, CASE WHEN is_unl THEN now() END, sc.reasons, to_jsonb(blk), now())
    ON CONFLICT (company_id, resource_id) DO UPDATE
      SET score = EXCLUDED.score, eligible = EXCLUDED.eligible,
          unlocked = public.grant_matches.unlocked OR EXCLUDED.unlocked,
          unlocked_at = COALESCE(public.grant_matches.unlocked_at, EXCLUDED.unlocked_at),
          reasons = EXCLUDED.reasons, missing = EXCLUDED.missing, computed_at = now()
      WHERE public.grant_matches.status NOT IN ('applied','dismissed');
    IF is_unl AND NOT coalesce(was_unl, false) THEN
      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (c.user_id, 'grant_unlocked', 'New grant unlocked: ' || r.title,
              coalesce(r.grant_amount_text,'Grant') || ' now matches ' || c.name ||
              CASE WHEN r.grant_deadline IS NOT NULL THEN '. Deadline ' || to_char(r.grant_deadline,'Mon DD, YYYY') || '.' ELSE '. Rolling applications.' END,
              jsonb_build_object('resource_id', r.id, 'score', sc.score));
      UPDATE public.grant_matches SET notified_at = now()
        WHERE company_id = c.id AND resource_id = r.id AND notified_at IS NULL;
    END IF;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.recompute_all_grant_matches()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid UUID; total INTEGER := 0;
BEGIN
  FOR cid IN SELECT id FROM public.companies LOOP
    total := total + public.recompute_grant_matches(cid);
  END LOOP;
  RETURN total;
END $$;

CREATE OR REPLACE FUNCTION public.trg_grant_matches_company() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN PERFORM public.recompute_grant_matches(NEW.id); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS companies_grant_matches ON public.companies;
CREATE TRIGGER companies_grant_matches AFTER INSERT OR UPDATE OF stage, industry, location, tags, is_women_owned, is_minority_owned, country, state, city
  ON public.companies FOR EACH ROW EXECUTE FUNCTION public.trg_grant_matches_company();

CREATE OR REPLACE FUNCTION public.trg_grant_matches_journey() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cid UUID;
BEGIN
  SELECT cs.company_id INTO cid FROM public.cohort_startups cs WHERE cs.id = NEW.cohort_startup_id;
  IF cid IS NOT NULL THEN PERFORM public.recompute_grant_matches(cid); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS journey_grant_matches ON public.startup_journey_milestones;
CREATE TRIGGER journey_grant_matches AFTER INSERT OR UPDATE OF status, completed_date
  ON public.startup_journey_milestones FOR EACH ROW EXECUTE FUNCTION public.trg_grant_matches_journey();

-- A new (or newly verified / re-dated) grant resource re-matches every startup.
CREATE OR REPLACE FUNCTION public.trg_grant_matches_new_grant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.resource_type = 'government_grant' THEN PERFORM public.recompute_all_grant_matches(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS resources_grant_matches ON public.resources;
CREATE TRIGGER resources_grant_matches AFTER INSERT OR UPDATE OF is_verified, grant_status, grant_deadline, grant_eligibility_tags, grant_industries, grant_required_steps, grant_women_owned_required, grant_state_focus
  ON public.resources FOR EACH ROW EXECUTE FUNCTION public.trg_grant_matches_new_grant();

-- Deadline sweep: called by generate-recommendations on each run, so the
-- recommendation feature itself keeps the catalog honest — expired grants
-- close and drop out of matches with no separate scanner or interface.
CREATE OR REPLACE FUNCTION public.expire_past_grants()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n INTEGER;
BEGIN
  UPDATE public.resources SET grant_status = 'closed'
   WHERE resource_type = 'government_grant'
     AND grant_deadline IS NOT NULL AND grant_deadline < now() AND NOT grant_is_rolling
     AND grant_status IN ('open','opening_soon','rolling');
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN PERFORM public.recompute_all_grant_matches(); END IF;
  RETURN n;
END $$;
