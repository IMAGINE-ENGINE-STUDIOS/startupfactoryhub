ALTER TABLE public.home_layout
  ADD COLUMN IF NOT EXISTS section_styles jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS text_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;