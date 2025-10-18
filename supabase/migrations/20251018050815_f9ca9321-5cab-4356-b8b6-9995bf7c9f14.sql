-- Create function to increment public job applications count
CREATE OR REPLACE FUNCTION public.increment_public_job_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.jobs
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$function$;

-- Create function to increment public internship applications count
CREATE OR REPLACE FUNCTION public.increment_public_internship_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.internships
  SET applications_count = applications_count + 1
  WHERE id = NEW.internship_id;
  RETURN NEW;
END;
$function$;

-- Create trigger for public job applications
CREATE TRIGGER on_public_job_application_created
  AFTER INSERT ON public.public_job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_public_job_applications();

-- Create trigger for public internship applications
CREATE TRIGGER on_public_internship_application_created
  AFTER INSERT ON public.public_internship_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_public_internship_applications();