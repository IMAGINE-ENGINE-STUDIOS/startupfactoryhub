-- Step 1: Create job_category enum
CREATE TYPE job_category AS ENUM ('full-time', 'part-time', 'contract', 'internship');

-- Step 2: Add new columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN category job_category DEFAULT 'full-time',
ADD COLUMN is_task_based BOOLEAN DEFAULT FALSE,
ADD COLUMN duration TEXT,
ADD COLUMN external_application_url TEXT;

-- Step 3: Create job_tasks table (unified tasks for all job types)
CREATE TABLE public.job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on job_tasks
ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_tasks
CREATE POLICY "Anyone can view tasks for active jobs"
ON public.job_tasks FOR SELECT
USING (job_id IN (SELECT id FROM public.jobs WHERE status = 'active'));

CREATE POLICY "Company owners can manage tasks for their jobs"
ON public.job_tasks FOR ALL
USING (job_id IN (
  SELECT j.id FROM public.jobs j
  JOIN public.companies c ON j.company_id = c.id
  WHERE c.user_id = auth.uid()
));

-- Step 4: Create student_job_tasks table (unified task tracking)
CREATE TABLE public.student_job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.job_tasks(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  time_spent_hours NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, task_id)
);

-- Enable RLS on student_job_tasks
ALTER TABLE public.student_job_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_job_tasks
CREATE POLICY "Students can view their own tasks"
ON public.student_job_tasks FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own tasks"
ON public.student_job_tasks FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Company owners can view tasks for their jobs"
ON public.student_job_tasks FOR SELECT
USING (application_id IN (
  SELECT ja.id FROM public.job_applications ja
  JOIN public.jobs j ON ja.job_id = j.id
  JOIN public.companies c ON j.company_id = c.id
  WHERE c.user_id = auth.uid()
));

-- Step 5: Create triggers for automatic task assignment
CREATE OR REPLACE FUNCTION public.sync_job_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a job application is accepted for a task-based job, create task entries
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO public.student_job_tasks (application_id, task_id, student_id)
    SELECT NEW.id, jt.id, NEW.user_id
    FROM public.job_tasks jt
    JOIN public.jobs j ON jt.job_id = j.id
    WHERE jt.job_id = NEW.job_id AND j.is_task_based = TRUE
    ON CONFLICT (application_id, task_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_job_tasks_on_acceptance
AFTER INSERT OR UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_job_tasks();

-- Step 6: Create trigger to sync new tasks to accepted students
CREATE OR REPLACE FUNCTION public.sync_new_job_task_to_students()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new task is created for a task-based job, assign to all accepted applicants
  INSERT INTO public.student_job_tasks (application_id, task_id, student_id)
  SELECT ja.id, NEW.id, ja.user_id
  FROM public.job_applications ja
  JOIN public.jobs j ON ja.job_id = j.id
  WHERE ja.job_id = NEW.job_id 
    AND ja.status = 'accepted' 
    AND j.is_task_based = TRUE
  ON CONFLICT (application_id, task_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_new_job_task_to_students
AFTER INSERT ON public.job_tasks
FOR EACH ROW
EXECUTE FUNCTION public.sync_new_job_task_to_students();

-- Step 7: Migrate existing internships to jobs table
INSERT INTO public.jobs (
  company_id, 
  title, 
  description, 
  location, 
  status, 
  applications_count,
  category,
  is_task_based,
  duration,
  compensation_type,
  created_at,
  updated_at
)
SELECT 
  company_id,
  title,
  description,
  location,
  status,
  applications_count,
  'internship'::job_category,
  TRUE,
  duration,
  'unpaid',
  created_at,
  updated_at
FROM public.internships
WHERE company_id IN (SELECT id FROM public.companies)
ON CONFLICT DO NOTHING;

-- Step 8: Create a temporary mapping table for internship to job migration
CREATE TEMP TABLE internship_job_mapping AS
SELECT 
  i.id as internship_id,
  j.id as job_id
FROM public.internships i
JOIN public.jobs j ON 
  j.company_id = i.company_id AND
  j.title = i.title AND
  j.description = i.description AND
  j.category = 'internship'::job_category;

-- Step 9: Migrate internship_tasks to job_tasks using the mapping
INSERT INTO public.job_tasks (id, job_id, title, description, due_date, created_at, updated_at)
SELECT it.id, ijm.job_id, it.title, it.description, it.due_date, it.created_at, it.updated_at
FROM public.internship_tasks it
JOIN internship_job_mapping ijm ON it.internship_id = ijm.internship_id
ON CONFLICT (id) DO NOTHING;

-- Step 10: Migrate internship applications to job applications
INSERT INTO public.job_applications (id, job_id, user_id, status, cover_letter, resume_url, created_at, updated_at)
SELECT ia.id, ijm.job_id, ia.user_id, ia.status, ia.cover_letter, ia.resume_url, ia.created_at, ia.updated_at
FROM public.internship_applications ia
JOIN internship_job_mapping ijm ON ia.internship_id = ijm.internship_id
ON CONFLICT (id) DO NOTHING;

-- Step 11: Migrate student_internship_tasks to student_job_tasks
INSERT INTO public.student_job_tasks (id, application_id, task_id, student_id, completed, completed_at, time_spent_hours, notes, created_at, updated_at)
SELECT id, application_id, task_id, student_id, completed, completed_at, time_spent_hours, notes, created_at, updated_at
FROM public.student_internship_tasks
WHERE application_id IN (SELECT id FROM public.job_applications)
  AND task_id IN (SELECT id FROM public.job_tasks)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Add updated_at triggers for new tables
CREATE TRIGGER update_job_tasks_updated_at
BEFORE UPDATE ON public.job_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_job_tasks_updated_at
BEFORE UPDATE ON public.student_job_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();