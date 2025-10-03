-- Fix the increment_internship_applications function to have proper search_path
CREATE OR REPLACE FUNCTION increment_internship_applications()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.internships
  SET applications_count = applications_count + 1
  WHERE id = NEW.internship_id;
  RETURN NEW;
END;
$$;