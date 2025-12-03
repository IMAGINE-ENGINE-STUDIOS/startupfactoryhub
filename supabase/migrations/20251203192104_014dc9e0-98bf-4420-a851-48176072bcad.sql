-- Add 'accelerator' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accelerator';

-- Create accelerator_profiles table
CREATE TABLE public.accelerator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  organization_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  location TEXT,
  founded_year INTEGER,
  total_cohorts INTEGER DEFAULT 0,
  total_startups_supported INTEGER DEFAULT 0,
  total_funding_raised BIGINT DEFAULT 0,
  industries_focus TEXT[],
  program_duration TEXT,
  equity_percentage DECIMAL(5,2),
  funding_offered BIGINT,
  is_accepting_applications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create accelerator_cohorts table
CREATE TABLE public.accelerator_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accelerator_id UUID REFERENCES public.accelerator_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  application_deadline DATE,
  max_startups INTEGER DEFAULT 20,
  current_startups INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  funding_per_startup BIGINT,
  equity_percentage DECIMAL(5,2),
  focus_industries TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cohort_applications table
CREATE TABLE public.cohort_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.accelerator_cohorts(id) ON DELETE CASCADE NOT NULL,
  startup_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  applicant_user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  pitch_deck_url TEXT,
  video_pitch_url TEXT,
  application_answers JSONB,
  reviewer_notes TEXT,
  interview_date TIMESTAMPTZ,
  applied_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_id, startup_id)
);

-- Create cohort_startups table
CREATE TABLE public.cohort_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES public.accelerator_cohorts(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  current_stage TEXT DEFAULT 'onboarding',
  progress_percentage INTEGER DEFAULT 0,
  funding_received BIGINT,
  equity_given DECIMAL(5,2),
  demo_day_slot TIMESTAMPTZ,
  graduation_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cohort_id, company_id)
);

-- Create startup_mentor_assignments table
CREATE TABLE public.startup_mentor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_startup_id UUID REFERENCES public.cohort_startups(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  focus_area TEXT,
  status TEXT DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(cohort_startup_id, mentor_id)
);

-- Create startup_advisor_assignments table
CREATE TABLE public.startup_advisor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_startup_id UUID REFERENCES public.cohort_startups(id) ON DELETE CASCADE NOT NULL,
  advisor_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  expertise_area TEXT,
  status TEXT DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(cohort_startup_id, advisor_id)
);

-- Create startup_journey_milestones table
CREATE TABLE public.startup_journey_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_startup_id UUID REFERENCES public.cohort_startups(id) ON DELETE CASCADE NOT NULL,
  milestone_name TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'pending',
  evidence_url TEXT,
  verified_by UUID,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.accelerator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accelerator_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_mentor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_advisor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_journey_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accelerator_profiles
CREATE POLICY "Anyone can view accelerator profiles" ON public.accelerator_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own accelerator profile" ON public.accelerator_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for accelerator_cohorts
CREATE POLICY "Anyone can view cohorts" ON public.accelerator_cohorts
  FOR SELECT USING (true);

CREATE POLICY "Accelerators can manage their cohorts" ON public.accelerator_cohorts
  FOR ALL USING (
    accelerator_id IN (SELECT id FROM public.accelerator_profiles WHERE user_id = auth.uid())
  ) WITH CHECK (
    accelerator_id IN (SELECT id FROM public.accelerator_profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for cohort_applications
CREATE POLICY "Accelerators can view applications to their cohorts" ON public.cohort_applications
  FOR SELECT USING (
    cohort_id IN (
      SELECT c.id FROM public.accelerator_cohorts c
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Startups can view their own applications" ON public.cohort_applications
  FOR SELECT USING (applicant_user_id = auth.uid());

CREATE POLICY "Startups can create applications" ON public.cohort_applications
  FOR INSERT WITH CHECK (applicant_user_id = auth.uid());

CREATE POLICY "Accelerators can update applications" ON public.cohort_applications
  FOR UPDATE USING (
    cohort_id IN (
      SELECT c.id FROM public.accelerator_cohorts c
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

-- RLS Policies for cohort_startups
CREATE POLICY "Anyone can view cohort startups" ON public.cohort_startups
  FOR SELECT USING (true);

CREATE POLICY "Accelerators can manage cohort startups" ON public.cohort_startups
  FOR ALL USING (
    cohort_id IN (
      SELECT c.id FROM public.accelerator_cohorts c
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  ) WITH CHECK (
    cohort_id IN (
      SELECT c.id FROM public.accelerator_cohorts c
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

-- RLS Policies for startup_mentor_assignments
CREATE POLICY "Anyone can view mentor assignments" ON public.startup_mentor_assignments
  FOR SELECT USING (true);

CREATE POLICY "Accelerators can manage mentor assignments" ON public.startup_mentor_assignments
  FOR ALL USING (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts c ON cs.cohort_id = c.id
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  ) WITH CHECK (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts c ON cs.cohort_id = c.id
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

-- RLS Policies for startup_advisor_assignments
CREATE POLICY "Anyone can view advisor assignments" ON public.startup_advisor_assignments
  FOR SELECT USING (true);

CREATE POLICY "Accelerators can manage advisor assignments" ON public.startup_advisor_assignments
  FOR ALL USING (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts c ON cs.cohort_id = c.id
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  ) WITH CHECK (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts c ON cs.cohort_id = c.id
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

-- RLS Policies for startup_journey_milestones
CREATE POLICY "Anyone can view milestones" ON public.startup_journey_milestones
  FOR SELECT USING (true);

CREATE POLICY "Accelerators can manage milestones" ON public.startup_journey_milestones
  FOR ALL USING (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts c ON cs.cohort_id = c.id
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  ) WITH CHECK (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts c ON cs.cohort_id = c.id
      JOIN public.accelerator_profiles ap ON c.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

-- Update handle_new_user function to create accelerator profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role public.app_role;
BEGIN
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'startup'::public.app_role
  );

  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF user_role = 'investor' THEN
    INSERT INTO public.investor_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'mentor' THEN
    INSERT INTO public.mentor_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF user_role = 'accelerator' THEN
    INSERT INTO public.accelerator_profiles (user_id, organization_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Accelerator'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create function to update cohort startup count
CREATE OR REPLACE FUNCTION public.update_cohort_startup_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.accelerator_cohorts
    SET current_startups = current_startups + 1
    WHERE id = NEW.cohort_id;
    
    UPDATE public.accelerator_profiles
    SET total_startups_supported = total_startups_supported + 1
    WHERE id = (SELECT accelerator_id FROM public.accelerator_cohorts WHERE id = NEW.cohort_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.accelerator_cohorts
    SET current_startups = GREATEST(0, current_startups - 1)
    WHERE id = OLD.cohort_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for cohort startup count
CREATE TRIGGER update_cohort_startup_count_trigger
AFTER INSERT OR DELETE ON public.cohort_startups
FOR EACH ROW EXECUTE FUNCTION public.update_cohort_startup_count();

-- Create function to update accelerator cohort count
CREATE OR REPLACE FUNCTION public.update_accelerator_cohort_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.accelerator_profiles
    SET total_cohorts = total_cohorts + 1
    WHERE id = NEW.accelerator_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.accelerator_profiles
    SET total_cohorts = GREATEST(0, total_cohorts - 1)
    WHERE id = OLD.accelerator_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for accelerator cohort count
CREATE TRIGGER update_accelerator_cohort_count_trigger
AFTER INSERT OR DELETE ON public.accelerator_cohorts
FOR EACH ROW EXECUTE FUNCTION public.update_accelerator_cohort_count();