
-- Add Frontier credentials columns for admin to fill on approval
ALTER TABLE public.flight_pass_requests
ADD COLUMN IF NOT EXISTS frontier_username TEXT,
ADD COLUMN IF NOT EXISTS frontier_password TEXT;
