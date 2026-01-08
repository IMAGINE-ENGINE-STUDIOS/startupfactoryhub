-- Step 1: Delete duplicate companies, keeping the oldest one per user_id
DELETE FROM companies 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM companies 
  ORDER BY user_id, created_at ASC
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE companies 
ADD CONSTRAINT companies_user_id_unique UNIQUE (user_id);