-- Add cohort to post_type enum
ALTER TYPE post_type ADD VALUE IF NOT EXISTS 'cohort';

-- Add cohort_data column to feed_posts
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS cohort_data jsonb;

-- Add linked_accelerator_id to resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS linked_accelerator_id uuid REFERENCES accelerator_profiles(id);

-- Add address/coordinates columns to accelerator_profiles
ALTER TABLE accelerator_profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE accelerator_profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE accelerator_profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE accelerator_profiles ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE accelerator_profiles ADD COLUMN IF NOT EXISTS longitude numeric;

-- Create index for faster resource lookups by accelerator
CREATE INDEX IF NOT EXISTS idx_resources_linked_accelerator ON resources(linked_accelerator_id) WHERE linked_accelerator_id IS NOT NULL;