-- Function to update company funding when investment is made
CREATE OR REPLACE FUNCTION public.sync_company_funding_amount()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_company_id UUID;
  total_funding BIGINT;
BEGIN
  -- Determine which company_id to use based on operation
  IF TG_OP = 'DELETE' THEN
    target_company_id := OLD.company_id;
  ELSE
    target_company_id := NEW.company_id;
  END IF;

  -- Only process if company_id is set (not external companies)
  IF target_company_id IS NOT NULL THEN
    -- Calculate total funding from all active investments
    SELECT COALESCE(SUM(amount), 0) INTO total_funding
    FROM public.investments
    WHERE company_id = target_company_id AND status = 'active';
    
    -- Update company funding_amount
    UPDATE public.companies
    SET funding_amount = total_funding, updated_at = now()
    WHERE id = target_company_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS sync_funding_on_investment ON public.investments;

-- Create trigger on investment insert/update/delete
CREATE TRIGGER sync_funding_on_investment
AFTER INSERT OR UPDATE OR DELETE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.sync_company_funding_amount();