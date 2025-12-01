-- Remove contact information from Nasdaq description since it's now displayed separately
UPDATE resources 
SET description = 'Online internships program connecting talented students with opportunities at the Nasdaq Entrepreneurial Center.'
WHERE title = 'Nasdaq Interns Match';