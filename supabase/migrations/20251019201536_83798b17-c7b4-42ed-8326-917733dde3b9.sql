-- Create advisor work experience table
CREATE TABLE public.advisor_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create advisor education table
CREATE TABLE public.advisor_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create advisor achievements table
CREATE TABLE public.advisor_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  organization TEXT,
  date DATE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create advisor skills table
CREATE TABLE public.advisor_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  category TEXT,
  endorsement_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Enable RLS
ALTER TABLE public.advisor_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advisor_experiences
CREATE POLICY "Anyone can view advisor experiences"
  ON public.advisor_experiences FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own experiences"
  ON public.advisor_experiences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for advisor_education
CREATE POLICY "Anyone can view advisor education"
  ON public.advisor_education FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own education"
  ON public.advisor_education FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for advisor_achievements
CREATE POLICY "Anyone can view advisor achievements"
  ON public.advisor_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own achievements"
  ON public.advisor_achievements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for advisor_skills
CREATE POLICY "Anyone can view advisor skills"
  ON public.advisor_skills FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own skills"
  ON public.advisor_skills FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_advisor_experiences_user_id ON public.advisor_experiences(user_id);
CREATE INDEX idx_advisor_education_user_id ON public.advisor_education(user_id);
CREATE INDEX idx_advisor_achievements_user_id ON public.advisor_achievements(user_id);
CREATE INDEX idx_advisor_skills_user_id ON public.advisor_skills(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_advisor_experiences_updated_at
  BEFORE UPDATE ON public.advisor_experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advisor_education_updated_at
  BEFORE UPDATE ON public.advisor_education
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();