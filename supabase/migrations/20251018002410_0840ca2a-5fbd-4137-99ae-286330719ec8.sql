-- Create jobs table with payment types
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  job_type TEXT DEFAULT 'full-time',
  experience_level TEXT,
  compensation_type TEXT NOT NULL DEFAULT 'salary',
  hourly_rate NUMERIC(10,2),
  salary_range_min NUMERIC(12,2),
  salary_range_max NUMERIC(12,2),
  requirements TEXT[],
  responsibilities TEXT[],
  benefits TEXT[],
  status TEXT DEFAULT 'active',
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Create internship tasks table (for startups to add tasks)
CREATE TABLE public.internship_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  estimated_hours NUMERIC(5,1),
  due_date TIMESTAMPTZ,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student task progress table (synced when internship accepted)
CREATE TABLE public.student_internship_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.internship_applications(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.internship_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  time_spent_hours NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, task_id)
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_internship_tasks ENABLE ROW LEVEL SECURITY;

-- Jobs RLS policies
CREATE POLICY "Anyone can view active jobs"
ON public.jobs FOR SELECT
USING (status = 'active');

CREATE POLICY "Company owners can manage their jobs"
ON public.jobs FOR ALL
USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

-- Job applications RLS policies
CREATE POLICY "Users can view their own job applications"
ON public.job_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create job applications"
ON public.job_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company owners can view applications for their jobs"
ON public.job_applications FOR SELECT
USING (
  job_id IN (
    SELECT j.id FROM public.jobs j
    JOIN public.companies c ON j.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Internship tasks RLS policies
CREATE POLICY "Anyone can view internship tasks"
ON public.internship_tasks FOR SELECT
USING (true);

CREATE POLICY "Company owners can manage tasks for their internships"
ON public.internship_tasks FOR ALL
USING (
  internship_id IN (
    SELECT i.id FROM public.internships i
    WHERE i.company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
  )
);

-- Student internship tasks RLS policies
CREATE POLICY "Students can view their own tasks"
ON public.student_internship_tasks FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own tasks"
ON public.student_internship_tasks FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Company owners can view tasks for their internships"
ON public.student_internship_tasks FOR SELECT
USING (
  application_id IN (
    SELECT ia.id FROM public.internship_applications ia
    JOIN public.internships i ON ia.internship_id = i.id
    WHERE i.company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
  )
);

-- Update existing internship_applications table RLS
CREATE POLICY "Users can update their internship applications" ON public.internship_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Company owners can view internship applications" ON public.internship_applications FOR SELECT
USING (internship_id IN (SELECT i.id FROM public.internships i WHERE i.company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())));
CREATE POLICY "Company owners can update internship application status" ON public.internship_applications FOR UPDATE
USING (internship_id IN (SELECT i.id FROM public.internships i WHERE i.company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())));

-- Trigger to increment job applications count
CREATE OR REPLACE FUNCTION public.increment_job_applications()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs
  SET applications_count = applications_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER increment_job_applications_trigger
AFTER INSERT ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.increment_job_applications();

-- Trigger to sync tasks when internship application is accepted
CREATE OR REPLACE FUNCTION public.sync_internship_tasks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO public.student_internship_tasks (application_id, task_id, student_id)
    SELECT NEW.id, it.id, NEW.user_id
    FROM public.internship_tasks it
    WHERE it.internship_id = NEW.internship_id
    ON CONFLICT (application_id, task_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_internship_tasks_trigger
AFTER INSERT OR UPDATE ON public.internship_applications
FOR EACH ROW EXECUTE FUNCTION public.sync_internship_tasks();

-- Trigger to auto-sync new tasks to accepted students
CREATE OR REPLACE FUNCTION public.sync_new_task_to_students()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.student_internship_tasks (application_id, task_id, student_id)
  SELECT ia.id, NEW.id, ia.user_id
  FROM public.internship_applications ia
  WHERE ia.internship_id = NEW.internship_id AND ia.status = 'accepted'
  ON CONFLICT (application_id, task_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_new_task_to_students_trigger
AFTER INSERT ON public.internship_tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_new_task_to_students();

-- Update timestamp triggers
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internship_tasks_updated_at BEFORE UPDATE ON public.internship_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_internship_tasks_updated_at BEFORE UPDATE ON public.student_internship_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();