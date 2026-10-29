-- SFH: ADAPTED COPY of Wonderlands migration 20261020093000_unified_lead_phase1.sql.
-- SFH: Of the WW original, only section 3 is SOCIALITE-relevant
-- SFH: (the pg_cron scheduler driver). Sections 1–2 (clients lead
-- SFH: columns + public.submit_lead intake) are Wonderlands CRM
-- SFH: platform SQL — SFH has no clients table — and are
-- SFH: COMMENTED OUT below. public.automation_edge_ping() is
-- SFH: kept ACTIVE but inert: it no-ops unless the
-- SFH: app.settings.supabase_url / app.settings.service_role_key
-- SFH: GUCs are set (and requires pg_net if ever called).
-- SFH: BOTH cron.schedule jobs at the end are COMMENTED OUT:
-- SFH: SFH drives socialite-scheduler with the VM systemd tick
-- SFH: (the proven driver, spec §6.2/§13.2), not pg_cron. The
-- SFH: automation-scheduled-outreach job is not SOCIALITE at
-- SFH: all and stays disabled regardless.

-- Wonderlands unified lead structure — Phase 1 (additive foundations only).
--
-- 1) clients gains the unified lead fields: stage / source_detail /
--    external_ids / consent. All additive, defaults only, no data moves.
--    (Verified absent from src/integrations/supabase/types.ts beforehand.)
-- 2) public.submit_lead(...) — the single intake for social / marketplace /
--    partner sources. Dedupes on lower(email) or phone against clients,
--    inserts or updates the clients row (stage 'new' on insert only) and
--    returns the client id. In this phase it writes ONLY to clients; the
--    CRM fan-out stays with the existing website RPCs
--    (submit_wonderlands_lead / submit_site_lead), untouched.
-- 3) pg_cron drivers for the two scheduler edge functions whose jobs were
--    previously only claimed in code comments: scheduled-outreach (the
--    automation engine's delayed-step runner) and socialite-scheduler
--    (timed sends + Autopilot top-up). They POST via pg_net using the same
--    app.settings.supabase_url / app.settings.service_role_key pattern as
--    the on_new_client_automation trigger (migration 20251222155037) and
--    are best-effort: unset GUCs log a NOTICE and no-op, matching that
--    trigger's behavior.
--
-- Safe to run (and re-run) in the Supabase SQL editor: columns use
-- IF NOT EXISTS, functions use CREATE OR REPLACE, cron.schedule replaces
-- a same-named job. pg_cron + pg_net are already enabled
-- (migration 20260316005929); no cron job existed before this file.

-- SFH: ---- Sections 1-2 commented out (Wonderlands CRM, not SOCIALITE) ----
-- -- ── 1) clients: unified lead fields ──────────────────────────────────────
-- ALTER TABLE public.clients
--   ADD COLUMN IF NOT EXISTS stage text DEFAULT 'new',
--   ADD COLUMN IF NOT EXISTS source_detail text,
--   ADD COLUMN IF NOT EXISTS external_ids jsonb DEFAULT '{}'::jsonb,
--   ADD COLUMN IF NOT EXISTS consent jsonb DEFAULT '{}'::jsonb;
--
-- -- ── 2) submit_lead: unified intake (clients only) ────────────────────────
-- -- Conventions mirror public.submit_wonderlands_lead (20261006161331):
-- -- SECURITY DEFINER, pinned search_path, trimmed/length-capped inputs,
-- -- lowercased email, platform company scoping, anon+authenticated execute.
-- -- Differences by design: returns the client id (uuid) instead of boolean
-- -- (NULL = rejected input), stores the real source (website RPC hardcodes
-- -- 'website_lead'), and dedupes instead of always inserting.
-- CREATE OR REPLACE FUNCTION public.submit_lead(
--   _source text,
--   _name text,
--   _email text,
--   _phone text,
--   _message text,
--   _source_detail text DEFAULT NULL,
--   _external_ids jsonb DEFAULT '{}'::jsonb
-- )
-- RETURNS uuid
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path TO 'public'
-- AS $function$
-- DECLARE
--   _cid uuid := public.platform_company_id();
--   _client uuid;
--   _n text := left(btrim(coalesce(_name, '')), 120);
--   _e text := lower(left(btrim(coalesce(_email, '')), 200));
--   _p text := left(btrim(coalesce(_phone, '')), 40);
--   _p_digits text := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
--   _m text := left(btrim(coalesce(_message, '')), 2000);
--   _s text := left(btrim(coalesce(_source, '')), 60);
--   _sd text := nullif(left(btrim(coalesce(_source_detail, '')), 300), '');
--   _ext jsonb := coalesce(_external_ids, '{}'::jsonb);
--   _first text;
--   _last text;
--   _note text;
-- BEGIN
--   IF _cid IS NULL OR _s = '' OR (_e = '' AND _p = '') THEN RETURN NULL; END IF;
--   IF _e <> '' AND _e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RETURN NULL; END IF;
--
--   -- Social intakes can arrive without a name; clients.first_name is
--   -- NOT NULL, so fall back to the email local part, then 'Unknown'.
--   IF _n = '' THEN
--     _n := coalesce(nullif(split_part(_e, '@', 1), ''), 'Unknown');
--   END IF;
--   _first := split_part(_n, ' ', 1);
--   _last := btrim(substr(_n, length(_first) + 1));
--
--   _note := nullif(concat_ws(E'\n',
--     'Lead: ' || _s || coalesce(' · ' || _sd, ''),
--     nullif(_m, '')), '');
--
--   -- Dedupe (house pattern, cf. handle_new_user): same lower(email) wins;
--   -- otherwise same phone digits (formatting-insensitive, min 7 digits).
--   -- Scoped to the platform company; oldest record is kept.
--   IF _e <> '' THEN
--     SELECT id INTO _client
--     FROM public.clients
--     WHERE company_id = _cid AND lower(email) = _e
--     ORDER BY created_at ASC
--     LIMIT 1;
--   END IF;
--   IF _client IS NULL AND length(_p_digits) >= 7 THEN
--     SELECT id INTO _client
--     FROM public.clients
--     WHERE company_id = _cid
--       AND phone IS NOT NULL
--       AND regexp_replace(phone, '\D', '', 'g') = _p_digits
--     ORDER BY created_at ASC
--     LIMIT 1;
--   END IF;
--
--   IF _client IS NOT NULL THEN
--     -- Repeat contact: fill only what is missing, merge external ids,
--     -- append the new message to the notes trail. Stage is deliberately
--     -- NOT reset — a returning lead keeps its pipeline position.
--     UPDATE public.clients SET
--       first_name = CASE WHEN coalesce(first_name, '') = '' THEN _first ELSE first_name END,
--       last_name = CASE WHEN coalesce(last_name, '') = '' THEN _last ELSE last_name END,
--       email = CASE WHEN coalesce(email, '') = '' THEN _e ELSE email END,
--       phone = coalesce(phone, nullif(_p, '')),
--       source_detail = coalesce(source_detail, _sd),
--       external_ids = coalesce(external_ids, '{}'::jsonb) || _ext,
--       notes = coalesce(notes || E'\n', '') || coalesce(_note, ''),
--       updated_at = now()
--     WHERE id = _client;
--     RETURN _client;
--   END IF;
--
--   INSERT INTO public.clients
--     (company_id, first_name, last_name, email, phone, source, status,
--      stage, source_detail, external_ids, consent, notes)
--   VALUES
--     (_cid, _first, _last, _e, nullif(_p, ''), _s, 'new',
--      'new', _sd, _ext, '{}'::jsonb, _note)
--   RETURNING id INTO _client;
--   RETURN _client;
-- END $function$;
-- REVOKE ALL ON FUNCTION public.submit_lead(text, text, text, text, text, text, jsonb) FROM public;
-- GRANT EXECUTE ON FUNCTION public.submit_lead(text, text, text, text, text, text, jsonb) TO anon, authenticated;
--
-- ── 3) Scheduler drivers (pg_cron -> pg_net -> edge functions) ───────────
-- Best-effort ping helper: same GUC reads as
-- trigger_new_client_automation, wrapped so a missing setting or a failed
-- POST logs a NOTICE instead of erroring the cron run.
CREATE OR REPLACE FUNCTION public.automation_edge_ping(_function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _base_url text := current_setting('app.settings.supabase_url', true);
  _key text := current_setting('app.settings.service_role_key', true);
BEGIN
  IF coalesce(_base_url, '') = '' OR coalesce(_key, '') = '' THEN
    RAISE NOTICE 'automation_edge_ping: app.settings.* not configured; skipping %', _function_name;
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := rtrim(_base_url, '/') || '/functions/v1/' || _function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _key
    ),
    body := jsonb_build_object('source', 'pg_cron', 'function', _function_name)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'automation_edge_ping(%) failed: %', _function_name, SQLERRM;
END;
$function$;
REVOKE ALL ON FUNCTION public.automation_edge_ping(text) FROM public;

-- SFH: ---- cron.schedule jobs commented out (VM tick is the SFH driver) ----
-- -- Delayed automation steps: scheduled-outreach every 5 minutes.
-- DO $do$
-- BEGIN
--   PERFORM cron.schedule(
--     'automation-scheduled-outreach',
--     '*/5 * * * *',
--     $cmd$SELECT public.automation_edge_ping('scheduled-outreach');$cmd$
--   );
-- EXCEPTION
--   WHEN OTHERS THEN
--     RAISE NOTICE 'cron.schedule(automation-scheduled-outreach) skipped: %', SQLERRM;
-- END
-- $do$;
--
-- -- Timed sends + Autopilot top-up: socialite-scheduler every 5 minutes.
-- DO $do$
-- BEGIN
--   PERFORM cron.schedule(
--     'socialite-scheduler-tick',
--     '*/5 * * * *',
--     $cmd$SELECT public.automation_edge_ping('socialite-scheduler');$cmd$
--   );
-- EXCEPTION
--   WHEN OTHERS THEN
--     RAISE NOTICE 'cron.schedule(socialite-scheduler-tick) skipped: %', SQLERRM;
-- END
-- $do$;
--