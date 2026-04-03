
-- Hot Deals Invited Startups
CREATE TABLE public.hot_deals_invited_startups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  pitch_title TEXT,
  description TEXT,
  logo_url TEXT,
  pitch_deck_url TEXT,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hot_deals_invited_startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invited startups"
  ON public.hot_deals_invited_startups FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert own"
  ON public.hot_deals_invited_startups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own"
  ON public.hot_deals_invited_startups FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hot Deals Votes
CREATE TABLE public.hot_deals_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.hot_deals_invited_startups(id) ON DELETE CASCADE,
  voter_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (startup_id, voter_name)
);

ALTER TABLE public.hot_deals_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.hot_deals_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert votes"
  ON public.hot_deals_votes FOR INSERT
  WITH CHECK (true);

-- Hot Deals Winner
CREATE TABLE public.hot_deals_winner (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_id UUID NOT NULL REFERENCES public.hot_deals_invited_startups(id) ON DELETE CASCADE,
  announced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hot_deals_winner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view winner"
  ON public.hot_deals_winner FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated can announce winner"
  ON public.hot_deals_winner FOR INSERT
  TO authenticated
  WITH CHECK (true);
