-- Village Staff table: host appoints staff members with roles and powers
CREATE TABLE IF NOT EXISTS public.village_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  appointed_by UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'moderator',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.village_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view village staff"
  ON public.village_staff FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Village host can appoint staff"
  ON public.village_staff FOR INSERT
  WITH CHECK (auth.uid() = appointed_by);

CREATE POLICY "Village host can remove staff"
  ON public.village_staff FOR DELETE
  USING (auth.uid() = appointed_by);

CREATE POLICY "Village host can update staff"
  ON public.village_staff FOR UPDATE
  USING (auth.uid() = appointed_by);
