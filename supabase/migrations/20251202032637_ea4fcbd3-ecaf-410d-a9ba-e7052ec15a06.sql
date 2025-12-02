-- Fix GitHub logo path to use public directory
UPDATE resources 
SET logo_url = '/github-logo.png' 
WHERE title = 'GitHub';