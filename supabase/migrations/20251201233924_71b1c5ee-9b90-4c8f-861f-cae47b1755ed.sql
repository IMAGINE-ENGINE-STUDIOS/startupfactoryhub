
-- Ensure Nasdaq resource uses the updated circular logo
UPDATE resources 
SET logo_url = '/nasdaq-marker-icon.jpg'
WHERE title = 'Nasdaq Interns Match';
