
-- Add subscription_tier column to hub_bookings to track what type of space the user is entitled to
ALTER TABLE public.hub_bookings ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'community';

-- Add index for tier filtering
CREATE INDEX IF NOT EXISTS idx_hub_bookings_subscription_tier ON public.hub_bookings(subscription_tier);
