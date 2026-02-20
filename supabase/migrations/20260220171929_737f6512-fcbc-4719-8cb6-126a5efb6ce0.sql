
-- Add village columns to live_rooms
ALTER TABLE public.live_rooms 
  ADD COLUMN IF NOT EXISTS room_category TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS current_host_id UUID,
  ADD COLUMN IF NOT EXISTS host_elected_at TIMESTAMPTZ;

-- Village Elections table
CREATE TABLE IF NOT EXISTS public.village_elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  concluded_at TIMESTAMPTZ,
  winner_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.village_elections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view elections"
  ON public.village_elections FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can create elections"
  ON public.village_elections FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can update elections"
  ON public.village_elections FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Village Votes table
CREATE TABLE IF NOT EXISTS public.village_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.village_elections(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_id, voter_id)
);

ALTER TABLE public.village_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view votes"
  ON public.village_votes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can cast their own vote"
  ON public.village_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- Seed the 3 permanent Village Rooms
INSERT INTO public.live_rooms (name, description, creator_id, meeting_link, is_active, is_public, expires_at, room_category)
SELECT 
  'The Plaza',
  'An open village square — join and talk about anything. Democracy decides who leads.',
  (SELECT id FROM auth.users LIMIT 1),
  'https://startupfactoryhub.whereby.com/the-plaza',
  true,
  true,
  '2099-01-01 00:00:00+00',
  'village'
WHERE NOT EXISTS (
  SELECT 1 FROM public.live_rooms WHERE room_category = 'village' AND name = 'The Plaza'
);

INSERT INTO public.live_rooms (name, description, creator_id, meeting_link, is_active, is_public, expires_at, room_category)
SELECT 
  'The Commons',
  'A community gathering space for open discussions, ideas, and collaboration.',
  (SELECT id FROM auth.users LIMIT 1),
  'https://startupfactoryhub.whereby.com/the-commons',
  true,
  true,
  '2099-01-01 00:00:00+00',
  'village'
WHERE NOT EXISTS (
  SELECT 1 FROM public.live_rooms WHERE room_category = 'village' AND name = 'The Commons'
);

INSERT INTO public.live_rooms (name, description, creator_id, meeting_link, is_active, is_public, expires_at, room_category)
SELECT 
  'The Agora',
  'Inspired by ancient Greek democracy — debate, vote, and shape your community.',
  (SELECT id FROM auth.users LIMIT 1),
  'https://startupfactoryhub.whereby.com/the-agora',
  true,
  true,
  '2099-01-01 00:00:00+00',
  'village'
WHERE NOT EXISTS (
  SELECT 1 FROM public.live_rooms WHERE room_category = 'village' AND name = 'The Agora'
);
