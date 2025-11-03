-- Add scheduling_link column to mentor_profiles table
ALTER TABLE mentor_profiles 
ADD COLUMN scheduling_link text;

-- Add comment for documentation
COMMENT ON COLUMN mentor_profiles.scheduling_link IS 'External scheduling link (Calendly, Cal.com, etc.)';