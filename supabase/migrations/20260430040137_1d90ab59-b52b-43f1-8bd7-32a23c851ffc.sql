ALTER TABLE public.legacy_imported_startups
ADD COLUMN IF NOT EXISTS pitch_deck_url text;

CREATE INDEX IF NOT EXISTS idx_legacy_startups_pitch_deck ON public.legacy_imported_startups(pitch_deck_url) WHERE pitch_deck_url IS NOT NULL;