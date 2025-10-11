-- Add pitch_deck_url column to companies table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'pitch_deck_url'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN pitch_deck_url text;
  END IF;
END $$;

-- Create pitch-decks storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch-decks', 'pitch-decks', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for pitch-decks bucket
CREATE POLICY "Anyone can view pitch decks"
ON storage.objects FOR SELECT
USING (bucket_id = 'pitch-decks');

CREATE POLICY "Startup owners can upload their pitch deck"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pitch-decks' AND
  auth.uid() IN (
    SELECT user_id FROM public.companies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Startup owners can update their pitch deck"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pitch-decks' AND
  auth.uid() IN (
    SELECT user_id FROM public.companies
    WHERE id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Startup owners can delete their pitch deck"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pitch-decks' AND
  auth.uid() IN (
    SELECT user_id FROM public.companies
    WHERE id::text = (storage.foldername(name))[1]
  )
);