-- Create internships table for dedicated internship management
CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  duration TEXT,
  compensation TEXT,
  requirements TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on internships
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internships
CREATE POLICY "Anyone can view active internships"
ON public.internships
FOR SELECT
USING (status = 'active');

CREATE POLICY "Startup users can manage their own internships"
ON public.internships
FOR ALL
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Create internship_applications table
CREATE TABLE IF NOT EXISTS public.internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  cover_letter TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(internship_id, user_id)
);

-- Enable RLS on internship_applications
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internship_applications
CREATE POLICY "Users can view their own applications"
ON public.internship_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
ON public.internship_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Company owners can view applications for their internships"
ON public.internship_applications
FOR SELECT
USING (
  internship_id IN (
    SELECT i.id FROM public.internships i
    JOIN public.companies c ON i.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can update application status"
ON public.internship_applications
FOR UPDATE
USING (
  internship_id IN (
    SELECT i.id FROM public.internships i
    JOIN public.companies c ON i.company_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Create roadmap_progress table to track user progress
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  step_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, step_id)
);

-- Enable RLS on roadmap_progress
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roadmap_progress
CREATE POLICY "Users can view their own roadmap progress"
ON public.roadmap_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own roadmap progress"
ON public.roadmap_progress
FOR ALL
USING (auth.uid() = user_id);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Users can view their own achievements"
ON public.achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements"
ON public.achievements
FOR INSERT
WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_internships_updated_at
BEFORE UPDATE ON public.internships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internship_applications_updated_at
BEFORE UPDATE ON public.internship_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmap_progress_updated_at
BEFORE UPDATE ON public.roadmap_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-increment applications_count when an application is created
CREATE OR REPLACE FUNCTION increment_internship_applications()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.internships
  SET applications_count = applications_count + 1
  WHERE id = NEW.internship_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER increment_applications_count
AFTER INSERT ON public.internship_applications
FOR EACH ROW
EXECUTE FUNCTION increment_internship_applications();