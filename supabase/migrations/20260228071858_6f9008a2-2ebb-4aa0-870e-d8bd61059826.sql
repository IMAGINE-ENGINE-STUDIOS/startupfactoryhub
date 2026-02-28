
-- Add external source tracking columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS external_source text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS external_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS external_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

-- Create unique index on external source + id to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_external_source_id 
ON public.events (external_source, external_id) 
WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

-- Allow the service role to insert Eventbrite events (no organizer_id needed for external events)
-- Make organizer_id nullable for external events or use a system user approach
-- We'll use a default system organizer_id approach instead

-- Create RLS policy for reading external events (public)
CREATE POLICY "Anyone can read external events"
ON public.events
FOR SELECT
USING (external_source IS NOT NULL);
