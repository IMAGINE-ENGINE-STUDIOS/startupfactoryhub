
ALTER TABLE public.ar_drops
  ADD COLUMN IF NOT EXISTS altitude_m double precision NOT NULL DEFAULT 1.6,
  ADD COLUMN IF NOT EXISTS yaw_deg double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pitch_deg double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size_m double precision NOT NULL DEFAULT 1.5;
