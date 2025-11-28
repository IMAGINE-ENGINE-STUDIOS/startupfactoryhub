-- Make company_id nullable in investments table
ALTER TABLE public.investments 
ALTER COLUMN company_id DROP NOT NULL;

-- Add external company columns
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS external_company_name text,
ADD COLUMN IF NOT EXISTS external_company_industry text,
ADD COLUMN IF NOT EXISTS external_company_website text;

-- Add check constraint to ensure either company_id OR external_company_name is provided
ALTER TABLE public.investments 
ADD CONSTRAINT investments_company_check 
CHECK (
  (company_id IS NOT NULL) OR (external_company_name IS NOT NULL AND external_company_name != '')
);

-- Update the INSERT policy to allow external company investments
DROP POLICY IF EXISTS "Investors can create investments" ON investments;

CREATE POLICY "Investors can create investments" ON investments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = investor_id 
  AND public.has_role(auth.uid(), 'investor')
);