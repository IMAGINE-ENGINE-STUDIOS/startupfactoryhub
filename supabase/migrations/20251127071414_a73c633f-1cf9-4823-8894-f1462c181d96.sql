-- Add banner_url column to study_groups table
ALTER TABLE study_groups 
ADD COLUMN banner_url text;

COMMENT ON COLUMN study_groups.banner_url IS 'URL of the banner image for the study room';