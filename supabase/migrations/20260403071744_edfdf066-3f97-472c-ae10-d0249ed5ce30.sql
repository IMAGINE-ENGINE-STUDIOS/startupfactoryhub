
-- Add unique vote tracking code and voter email
ALTER TABLE public.hot_deals_votes 
  ADD COLUMN IF NOT EXISTS vote_code text UNIQUE DEFAULT 'VOTE-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
  ADD COLUMN IF NOT EXISTS voter_email text;

-- Drop old unique constraint (one vote per startup per voter)
ALTER TABLE public.hot_deals_votes DROP CONSTRAINT IF EXISTS hot_deals_votes_startup_id_voter_name_key;

-- Add new unique constraint (one vote total per voter name)
ALTER TABLE public.hot_deals_votes ADD CONSTRAINT hot_deals_votes_voter_name_unique UNIQUE (voter_name);

-- Create function to generate vote code on insert
CREATE OR REPLACE FUNCTION public.generate_vote_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.vote_code := 'VOTE-' || upper(substr(md5(NEW.voter_name || NEW.startup_id::text || clock_timestamp()::text), 1, 12));
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate vote code
DROP TRIGGER IF EXISTS set_vote_code ON public.hot_deals_votes;
CREATE TRIGGER set_vote_code
  BEFORE INSERT ON public.hot_deals_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_vote_code();
