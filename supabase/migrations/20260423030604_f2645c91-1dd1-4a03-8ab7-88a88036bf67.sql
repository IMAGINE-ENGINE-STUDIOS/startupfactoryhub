-- 1. Add 'member' to the app_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'member'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'member';
  END IF;
END $$;

-- 2. Create company_members table
CREATE TABLE IF NOT EXISTS public.company_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  title         TEXT,
  seniority     TEXT NOT NULL DEFAULT 'member' CHECK (seniority IN ('cofounder', 'lead', 'member')),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message       TEXT,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at  TIMESTAMPTZ,
  responded_by  UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_status ON public.company_members(status);

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies

-- Anyone (including anon) can view APPROVED memberships -> public team display
CREATE POLICY "Anyone can view approved memberships"
ON public.company_members
FOR SELECT
USING (status = 'approved');

-- A user can view their own membership rows (any status)
CREATE POLICY "Members view their own rows"
ON public.company_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Company owners can view all rows for their companies
CREATE POLICY "Company owners view team rows"
ON public.company_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_members.company_id
      AND c.user_id = auth.uid()
  )
);

-- A user can request to join (insert as themselves, status pending)
CREATE POLICY "Users can request to join a startup"
ON public.company_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

-- Company owners can update any row for their company (approve/reject/edit title)
CREATE POLICY "Company owners manage team rows"
ON public.company_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_members.company_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_members.company_id
      AND c.user_id = auth.uid()
  )
);

-- Member can delete their own row (leave the team / cancel request)
CREATE POLICY "Members can leave the team"
ON public.company_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Company owners can delete (remove) any team member
CREATE POLICY "Company owners can remove members"
ON public.company_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_members.company_id
      AND c.user_id = auth.uid()
  )
);

-- 4. updated_at trigger
DROP TRIGGER IF EXISTS update_company_members_updated_at ON public.company_members;
CREATE TRIGGER update_company_members_updated_at
BEFORE UPDATE ON public.company_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Notification trigger: new join request -> notify founder
CREATE OR REPLACE FUNCTION public.notify_team_join_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name   TEXT;
  v_company_logo   TEXT;
  v_owner_id       UUID;
  v_owner_email    TEXT;
  v_owner_name     TEXT;
  v_requester_name TEXT;
  v_requester_avatar TEXT;
BEGIN
  SELECT c.name, c.logo_url, c.user_id
    INTO v_company_name, v_company_logo, v_owner_id
  FROM public.companies c
  WHERE c.id = NEW.company_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email, COALESCE(full_name, email)
    INTO v_owner_email, v_owner_name
  FROM public.profiles
  WHERE user_id = v_owner_id;

  SELECT COALESCE(full_name, email), avatar_url
    INTO v_requester_name, v_requester_avatar
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_owner_id,
    'New team join request',
    COALESCE(v_requester_name, 'Someone') || ' wants to join the team at ' || COALESCE(v_company_name, 'your startup')
      || COALESCE(' as ' || NEW.title, ''),
    'info'
  );

  IF v_owner_email IS NOT NULL THEN
    PERFORM public.send_notification_email(
      v_owner_email,
      'New team join request',
      COALESCE(v_requester_name, 'A user') || ' has requested to join your team at <strong>'
        || COALESCE(v_company_name, 'your startup') || '</strong>'
        || COALESCE(' as <strong>' || NEW.title || '</strong>', '')
        || '. Log in to your dashboard to approve or reject the request.',
      'info',
      v_requester_name, v_requester_avatar, 'member', v_owner_name
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_team_join_request ON public.company_members;
CREATE TRIGGER trg_notify_team_join_request
AFTER INSERT ON public.company_members
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_team_join_request();

-- 6. Notification trigger: status change -> notify member
CREATE OR REPLACE FUNCTION public.notify_team_request_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_name TEXT;
  v_company_logo TEXT;
  v_member_email TEXT;
  v_member_name  TEXT;
  v_label        TEXT;
  v_type         TEXT;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT c.name, c.logo_url INTO v_company_name, v_company_logo
  FROM public.companies c WHERE c.id = NEW.company_id;

  SELECT email, COALESCE(full_name, email)
    INTO v_member_email, v_member_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  IF NEW.status = 'approved' THEN
    v_label := 'You joined the team at ' || COALESCE(v_company_name, 'a startup');
    v_type  := 'success';
  ELSE
    v_label := 'Your request to join ' || COALESCE(v_company_name, 'the team') || ' was declined';
    v_type  := 'error';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.user_id, v_label, v_label, v_type);

  IF v_member_email IS NOT NULL THEN
    PERFORM public.send_notification_email(
      v_member_email,
      v_label,
      v_label || '. Log in to view the team page.',
      v_type,
      COALESCE(v_company_name, 'Startup Factory Hub'),
      v_company_logo,
      'company',
      v_member_name
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_team_request_decision ON public.company_members;
CREATE TRIGGER trg_notify_team_request_decision
AFTER UPDATE OF status ON public.company_members
FOR EACH ROW
EXECUTE FUNCTION public.notify_team_request_decision();