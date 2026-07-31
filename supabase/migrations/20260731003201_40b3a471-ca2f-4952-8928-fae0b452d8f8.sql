CREATE OR REPLACE FUNCTION public.is_live_room_participant(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.live_room_participants
    WHERE room_id = _room_id AND user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "Participants of accessible rooms are visible" ON public.live_room_participants;

CREATE POLICY "Participants of accessible rooms are visible"
ON public.live_room_participants
FOR SELECT
USING (
  room_id IN (SELECT id FROM public.live_rooms WHERE COALESCE(is_private, false) = false)
  OR room_id IN (SELECT id FROM public.live_rooms WHERE creator_id = auth.uid())
  OR public.is_live_room_participant(room_id, auth.uid())
);