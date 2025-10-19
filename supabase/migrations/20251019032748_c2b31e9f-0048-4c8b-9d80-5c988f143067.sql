-- Create advisor_job_tasks table for tracking advisor/mentor task completion
CREATE TABLE IF NOT EXISTS public.advisor_job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.job_tasks(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, advisor_id)
);

-- Enable RLS
ALTER TABLE public.advisor_job_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advisors/mentors can view and manage their own tasks
CREATE POLICY "Advisors can manage their own tasks"
ON public.advisor_job_tasks
FOR ALL
TO authenticated
USING (auth.uid() = advisor_id)
WITH CHECK (auth.uid() = advisor_id);

-- RLS Policy: Company owners can view task completion for their jobs
CREATE POLICY "Companies can view task completion"
ON public.advisor_job_tasks
FOR SELECT
TO authenticated
USING (
  task_id IN (
    SELECT jt.id 
    FROM job_tasks jt
    JOIN jobs j ON jt.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_advisor_job_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER advisor_job_tasks_updated_at
BEFORE UPDATE ON public.advisor_job_tasks
FOR EACH ROW
EXECUTE FUNCTION update_advisor_job_tasks_updated_at();

-- Add indexes for performance
CREATE INDEX idx_advisor_job_tasks_advisor_id ON public.advisor_job_tasks(advisor_id);
CREATE INDEX idx_advisor_job_tasks_task_id ON public.advisor_job_tasks(task_id);

-- Create RPC function to batch fetch user roles
CREATE OR REPLACE FUNCTION get_user_roles_batch(user_ids UUID[])
RETURNS TABLE(user_id UUID, role app_role)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, role
  FROM public.user_roles
  WHERE user_id = ANY(user_ids);
$$;