-- First, let's ensure both triggers exist and are properly set up
DROP TRIGGER IF EXISTS increment_job_applications_trigger ON public.job_applications;
DROP TRIGGER IF EXISTS increment_public_job_applications_trigger ON public.public_job_applications;

-- Recreate the trigger for authenticated job applications
CREATE TRIGGER increment_job_applications_trigger
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_job_applications();

-- Recreate the trigger for public job applications  
CREATE TRIGGER increment_public_job_applications_trigger
  AFTER INSERT ON public.public_job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_public_job_applications();

-- Now sync all existing counts to match reality
UPDATE public.jobs j
SET applications_count = (
  SELECT COUNT(*) 
  FROM public.job_applications ja 
  WHERE ja.job_id = j.id
) + (
  SELECT COUNT(*) 
  FROM public.public_job_applications pja 
  WHERE pja.job_id = j.id
);