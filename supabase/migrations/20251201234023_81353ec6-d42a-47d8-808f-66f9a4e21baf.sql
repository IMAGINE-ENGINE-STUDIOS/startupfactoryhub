
-- Add is_official_partner field to distinguish official partners from regular resources with logos
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_official_partner BOOLEAN DEFAULT false;

-- Set existing partners (like GitHub and Lovable) as official partners
UPDATE resources 
SET is_official_partner = true 
WHERE title IN ('GitHub', '10 credits on Lovable');

-- Ensure Nasdaq is NOT an official partner
UPDATE resources 
SET is_official_partner = false 
WHERE title = 'Nasdaq Interns Match';
