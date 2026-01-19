-- Add external registration URL column to events table
ALTER TABLE events 
ADD COLUMN external_registration_url TEXT;