-- Create application invitations table for external applicants
CREATE TABLE public.application_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.public_job_applications(id) ON DELETE CASCADE NOT NULL,
  applicant_email TEXT NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.application_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for application invitations
CREATE POLICY "Company owners can view invitations for their jobs"
ON public.application_invitations
FOR SELECT
USING (
  application_id IN (
    SELECT pa.id
    FROM public.public_job_applications pa
    JOIN public.jobs j ON pa.job_id = j.id
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can create invitations"
ON public.application_invitations
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT pa.id
    FROM public.public_job_applications pa
    JOIN public.jobs j ON pa.job_id = j.id
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "System can update invitations"
ON public.application_invitations
FOR UPDATE
USING (true);

-- Trigger to sync tasks when public application is accepted AND user has registered
CREATE OR REPLACE FUNCTION public.sync_job_tasks_for_invited_applicants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_job_id UUID;
  v_is_task_based BOOLEAN;
  v_linked_user_id UUID;
BEGIN
  -- Get the linked user_id from invitation if exists
  SELECT linked_user_id INTO v_linked_user_id
  FROM public.application_invitations
  WHERE application_id = NEW.id AND status = 'accepted'
  LIMIT 1;
  
  -- Only proceed if we have a linked user
  IF v_linked_user_id IS NOT NULL AND NEW.status = 'accepted' THEN
    -- Get job details
    SELECT j.id, j.is_task_based 
    INTO v_job_id, v_is_task_based
    FROM public.jobs j
    WHERE j.id = NEW.job_id;
    
    -- If this is a task-based job, create task assignments
    IF v_is_task_based = TRUE THEN
      INSERT INTO public.student_job_tasks (application_id, task_id, student_id)
      SELECT NEW.id, jt.id, v_linked_user_id
      FROM public.job_tasks jt
      WHERE jt.job_id = v_job_id
      ON CONFLICT (application_id, task_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_public_job_application_accepted_with_user
  AFTER UPDATE ON public.public_job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_tasks_for_invited_applicants();

-- Update student_job_tasks to allow NULL student_id temporarily for external applicants
ALTER TABLE public.student_job_tasks ALTER COLUMN student_id DROP NOT NULL;

-- Add index for performance
CREATE INDEX idx_application_invitations_token ON public.application_invitations(invitation_token);
CREATE INDEX idx_application_invitations_email ON public.application_invitations(applicant_email);
CREATE INDEX idx_public_job_applications_status ON public.public_job_applications(status);