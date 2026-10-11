CREATE TABLE public.account_links (
  user_id uuid PRIMARY KEY,
  group_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_links TO service_role;
ALTER TABLE public.account_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.account_link_codes (
  code text PRIMARY KEY,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_link_codes TO service_role;
ALTER TABLE public.account_link_codes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_account_link_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  DELETE FROM account_link_codes WHERE user_id = auth.uid() OR expires_at < now();
  c := encode(gen_random_bytes(24), 'hex');
  INSERT INTO account_link_codes(code, user_id) VALUES (c, auth.uid());
  RETURN c;
END $$;

CREATE OR REPLACE FUNCTION public.redeem_account_link_code(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE other uuid; g_me uuid; g_other uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT user_id INTO other FROM account_link_codes WHERE code = _code AND expires_at > now();
  IF other IS NULL THEN RAISE EXCEPTION 'link code expired'; END IF;
  DELETE FROM account_link_codes WHERE code = _code;
  IF other = auth.uid() THEN RETURN false; END IF;
  SELECT group_id INTO g_me FROM account_links WHERE user_id = auth.uid();
  SELECT group_id INTO g_other FROM account_links WHERE user_id = other;
  IF g_me IS NULL THEN g_me := coalesce(g_other, gen_random_uuid());
    INSERT INTO account_links(user_id, group_id) VALUES (auth.uid(), g_me); END IF;
  IF g_other IS NULL THEN INSERT INTO account_links(user_id, group_id) VALUES (other, g_me);
  ELSIF g_other <> g_me THEN UPDATE account_links SET group_id = g_me WHERE group_id = g_other; END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.unlink_my_account()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM account_links WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_linked_accounts()
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, role app_role, email text, is_current boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.full_name, p.avatar_url,
    (SELECT r.role FROM user_roles r WHERE r.user_id = p.user_id ORDER BY (r.role='admin') LIMIT 1),
    u.email::text, p.user_id = auth.uid()
  FROM account_links l
  JOIN account_links me ON me.group_id = l.group_id AND me.user_id = auth.uid()
  JOIN profiles p ON p.user_id = l.user_id
  JOIN auth.users u ON u.id = l.user_id
  ORDER BY (p.user_id = auth.uid()) DESC, l.created_at;
$$;

CREATE OR REPLACE FUNCTION public.get_account_groups(user_ids uuid[])
RETURNS TABLE(user_id uuid, group_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.user_id, l.group_id FROM account_links l
  WHERE auth.uid() IS NOT NULL AND l.group_id IN (SELECT group_id FROM account_links WHERE user_id = ANY(user_ids));
$$;

REVOKE ALL ON FUNCTION public.create_account_link_code(), public.redeem_account_link_code(text), public.unlink_my_account(), public.get_my_linked_accounts(), public.get_account_groups(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_account_link_code(), public.redeem_account_link_code(text), public.unlink_my_account(), public.get_my_linked_accounts(), public.get_account_groups(uuid[]) TO authenticated;