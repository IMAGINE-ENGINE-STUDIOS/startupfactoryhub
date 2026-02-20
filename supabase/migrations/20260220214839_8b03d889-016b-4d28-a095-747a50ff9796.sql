
-- Village enhancements: invitation codes, membership pricing, marketplace, sale voting

-- Add new columns to live_rooms
ALTER TABLE public.live_rooms
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS invitation_code text,
  ADD COLUMN IF NOT EXISTS membership_fee_cents integer DEFAULT 200, -- $2.00 default (1 join + 1 gov fund)
  ADD COLUMN IF NOT EXISTS government_fund_cents integer DEFAULT 100,  -- $1.00 to gov fund
  ADD COLUMN IF NOT EXISTS join_fee_cents integer DEFAULT 100,          -- $1.00 to join
  ADD COLUMN IF NOT EXISTS for_sale boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price_cents bigint,
  ADD COLUMN IF NOT EXISTS sale_initiated_by uuid,
  ADD COLUMN IF NOT EXISTS creator_id uuid;

-- Village sale votes table (democratic republic sale voting)
CREATE TABLE IF NOT EXISTS public.village_sale_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  vote boolean NOT NULL, -- true = yes to sale, false = no
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(room_id, voter_id)
);

ALTER TABLE public.village_sale_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sale votes" ON public.village_sale_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.village_sale_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update their own vote" ON public.village_sale_votes
  FOR UPDATE USING (auth.uid() = voter_id);

-- Village marketplace listings
CREATE TABLE IF NOT EXISTS public.village_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  asking_price_cents bigint NOT NULL,
  description text,
  status text DEFAULT 'active', -- active, sold, cancelled
  platform_cut_percent numeric DEFAULT 20.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sold_at timestamp with time zone,
  buyer_id uuid,
  stripe_session_id text
);

ALTER TABLE public.village_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read marketplace listings" ON public.village_marketplace
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can list villages" ON public.village_marketplace
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their listings" ON public.village_marketplace
  FOR UPDATE USING (auth.uid() = seller_id);

-- Village member payments tracking
CREATE TABLE IF NOT EXISTS public.village_member_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.live_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  payment_status text DEFAULT 'pending',
  stripe_session_id text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.village_member_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own payments" ON public.village_member_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON public.village_member_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.village_member_payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create unique index on invitation_code for private villages
CREATE UNIQUE INDEX IF NOT EXISTS idx_live_rooms_invitation_code ON public.live_rooms(invitation_code) WHERE invitation_code IS NOT NULL;

-- Index for marketplace
CREATE INDEX IF NOT EXISTS idx_village_marketplace_room_id ON public.village_marketplace(room_id);
CREATE INDEX IF NOT EXISTS idx_village_marketplace_status ON public.village_marketplace(status);
CREATE INDEX IF NOT EXISTS idx_village_sale_votes_room_id ON public.village_sale_votes(room_id);
