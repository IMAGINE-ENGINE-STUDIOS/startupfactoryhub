CREATE TABLE public.net_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'General',
  avatar_url text,
  banner_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.net_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.net_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
CREATE TABLE public.net_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.net_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.net_group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.net_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  location text,
  meeting_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.net_group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.net_groups(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, invited_user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.net_groups, public.net_group_members, public.net_group_messages, public.net_group_events, public.net_group_invites TO authenticated;
GRANT ALL ON public.net_groups, public.net_group_members, public.net_group_messages, public.net_group_events, public.net_group_invites TO service_role;

ALTER TABLE public.net_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_group_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_group_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_net_group_member(_group uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.net_group_members WHERE group_id = _group AND user_id = _user)
$$;
CREATE OR REPLACE FUNCTION public.is_net_group_admin(_group uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.net_group_members WHERE group_id = _group AND user_id = _user AND role IN ('owner','admin'))
$$;
CREATE OR REPLACE FUNCTION public.is_net_group_public(_group uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_public FROM public.net_groups WHERE id = _group), false)
$$;
CREATE OR REPLACE FUNCTION public.has_net_group_invite(_group uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.net_group_invites WHERE group_id = _group AND invited_user_id = _user AND status = 'pending')
$$;

-- Groups
CREATE POLICY "View public or own groups" ON public.net_groups FOR SELECT TO authenticated
  USING (is_public OR created_by = auth.uid() OR public.is_net_group_member(id, auth.uid()) OR public.has_net_group_invite(id, auth.uid()));
CREATE POLICY "Create groups" ON public.net_groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins update groups" ON public.net_groups FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_net_group_admin(id, auth.uid()));
CREATE POLICY "Owner deletes group" ON public.net_groups FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Members
CREATE POLICY "View members" ON public.net_group_members FOR SELECT TO authenticated
  USING (public.is_net_group_public(group_id) OR public.is_net_group_member(group_id, auth.uid()));
CREATE POLICY "Join group" ON public.net_group_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (
    public.is_net_group_public(group_id) OR public.has_net_group_invite(group_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.net_groups g WHERE g.id = group_id AND g.created_by = auth.uid())
  ) AND (role = 'member' OR EXISTS (SELECT 1 FROM public.net_groups g WHERE g.id = group_id AND g.created_by = auth.uid())));
CREATE POLICY "Leave or remove" ON public.net_group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_net_group_admin(group_id, auth.uid()));
CREATE POLICY "Admins change roles" ON public.net_group_members FOR UPDATE TO authenticated
  USING (public.is_net_group_admin(group_id, auth.uid()));

-- Messages
CREATE POLICY "Members read chat" ON public.net_group_messages FOR SELECT TO authenticated USING (public.is_net_group_member(group_id, auth.uid()));
CREATE POLICY "Members post chat" ON public.net_group_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_net_group_member(group_id, auth.uid()));
CREATE POLICY "Delete own message" ON public.net_group_messages FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_net_group_admin(group_id, auth.uid()));

-- Events
CREATE POLICY "View group events" ON public.net_group_events FOR SELECT TO authenticated
  USING (public.is_net_group_public(group_id) OR public.is_net_group_member(group_id, auth.uid()));
CREATE POLICY "Members create events" ON public.net_group_events FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_net_group_member(group_id, auth.uid()));
CREATE POLICY "Creator or admin edits events" ON public.net_group_events FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_net_group_admin(group_id, auth.uid()));
CREATE POLICY "Creator or admin deletes events" ON public.net_group_events FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_net_group_admin(group_id, auth.uid()));

-- Invites
CREATE POLICY "View own invites" ON public.net_group_invites FOR SELECT TO authenticated
  USING (invited_user_id = auth.uid() OR invited_by = auth.uid() OR public.is_net_group_admin(group_id, auth.uid()));
CREATE POLICY "Members invite" ON public.net_group_invites FOR INSERT TO authenticated
  WITH CHECK (invited_by = auth.uid() AND public.is_net_group_member(group_id, auth.uid()));
CREATE POLICY "Invitee responds" ON public.net_group_invites FOR UPDATE TO authenticated USING (invited_user_id = auth.uid());
CREATE POLICY "Delete invites" ON public.net_group_invites FOR DELETE TO authenticated
  USING (invited_user_id = auth.uid() OR invited_by = auth.uid() OR public.is_net_group_admin(group_id, auth.uid()));

CREATE TRIGGER net_groups_updated_at BEFORE UPDATE ON public.net_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.net_group_add_owner() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.net_group_members (group_id, user_id, role) VALUES (NEW.id, NEW.created_by, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER net_groups_add_owner AFTER INSERT ON public.net_groups FOR EACH ROW EXECUTE FUNCTION public.net_group_add_owner();

CREATE OR REPLACE FUNCTION public.net_group_notify_invite() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gname text;
BEGIN
  SELECT name INTO gname FROM public.net_groups WHERE id = NEW.group_id;
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (NEW.invited_user_id, 'group_invite', 'Group invitation', 'You were invited to join ' || COALESCE(gname, 'a group'));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END $$;
CREATE TRIGGER net_group_invite_notify AFTER INSERT ON public.net_group_invites FOR EACH ROW EXECUTE FUNCTION public.net_group_notify_invite();

ALTER PUBLICATION supabase_realtime ADD TABLE public.net_group_messages;