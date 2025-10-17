-- Add missing columns to crm_cards table
ALTER TABLE public.crm_cards
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS tasks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes text;