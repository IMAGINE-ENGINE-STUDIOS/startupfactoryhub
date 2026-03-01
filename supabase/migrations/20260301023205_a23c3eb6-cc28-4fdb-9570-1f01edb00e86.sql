-- Fix notifications from mentors that were incorrectly labeled as "New Investor Interest"
UPDATE notifications
SET title = 'New Mentor Interest'
WHERE id IN ('30e63e97-197a-4611-a31f-9fbda9c0e4b1', '96fcb374-a228-48b9-8b86-97ce2216db63', 'a0d5f6d6-4736-4f00-a351-62aa2c674093');

-- Fix notification from startup/admin user
UPDATE notifications
SET title = 'New Interest'
WHERE id = '5d962c79-7813-4c8e-9ebb-5172f30d216d';