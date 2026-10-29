-- SFH: NEW FILE (SFH-only, not from Wonderlands) — SOCIALITE prerequisites.
-- SFH: The Wonderlands socialite migrations (files 20260930…–20261020… in
-- SFH: this pack) use public.is_main_admin() in RLS policies but never define
-- SFH: it — in Wonderlands it comes from a platform migration
-- SFH: (20250725204018) as: profiles.role = 'main_admin' AND is_active.
-- SFH: SFH has no is_main_admin() and no 'main_admin' role value. SFH's
-- SFH: admin check is public.has_role(uid, 'admin') over public.user_roles
-- SFH: (the founder's account carries 'admin' + 'accelerator'). This shim
-- SFH: defines is_main_admin() with SFH semantics so every staged policy
-- SFH: resolves unchanged. It creates no tables and changes no data.
-- SFH: NOTE: three staged edge-function code paths were likewise corrected
-- SFH: from profiles.role to user_roles (socialite-scheduler, socialite-api,
-- SFH: _shared/socialiteShield.ts) — see BACKEND-PACK-REPORT.md §5.
-- SFH CORRECTION (2026-10-29): the first version read profiles.role, but
-- SFH's profiles table has NO role column — roles live in public.user_roles
-- and are checked by public.has_role(uuid, app_role). The live run of the
-- first version failed with ERROR 42703 (column "role" does not exist);
-- nothing from it was applied. This version delegates to has_role.
CREATE OR REPLACE FUNCTION public.is_main_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;
