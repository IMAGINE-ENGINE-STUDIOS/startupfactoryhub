-- Add company_name field to CRM cards
ALTER TABLE public.crm_cards 
ADD COLUMN company_name TEXT;