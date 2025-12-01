
-- Update Nasdaq resource to use circular logo for map marker
UPDATE resources 
SET logo_url = '/nasdaq-marker-icon.jpg'
WHERE title = 'Nasdaq Interns Match';
