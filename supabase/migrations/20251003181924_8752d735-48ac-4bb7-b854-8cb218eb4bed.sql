-- Create mentorship_relationships table
CREATE TABLE IF NOT EXISTS public.mentorship_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL,
  mentee_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  goals TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

-- Enable RLS on mentorship_relationships
ALTER TABLE public.mentorship_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentorship_relationships
CREATE POLICY "Users can view their mentorships as mentor"
ON public.mentorship_relationships
FOR SELECT
USING (auth.uid() = mentor_id);

CREATE POLICY "Users can view their mentorships as mentee"
ON public.mentorship_relationships
FOR SELECT
USING (auth.uid() = mentee_id);

CREATE POLICY "Mentees can create mentorship requests"
ON public.mentorship_relationships
FOR INSERT
WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentors can update their mentorships"
ON public.mentorship_relationships
FOR UPDATE
USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can update their mentorships"
ON public.mentorship_relationships
FOR UPDATE
USING (auth.uid() = mentee_id);

-- Create mentoring_sessions table
CREATE TABLE IF NOT EXISTS public.mentoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id UUID REFERENCES public.mentorship_relationships(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL,
  mentee_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  topic TEXT,
  description TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on mentoring_sessions
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentoring_sessions
CREATE POLICY "Mentors can view their sessions"
ON public.mentoring_sessions
FOR SELECT
USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can view their sessions"
ON public.mentoring_sessions
FOR SELECT
USING (auth.uid() = mentee_id);

CREATE POLICY "Mentors can manage their sessions"
ON public.mentoring_sessions
FOR ALL
USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can create and update their sessions"
ON public.mentoring_sessions
FOR INSERT
WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Mentees can update their own sessions"
ON public.mentoring_sessions
FOR UPDATE
USING (auth.uid() = mentee_id);

-- Create session_feedback table
CREATE TABLE IF NOT EXISTS public.session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mentoring_sessions(id) ON DELETE CASCADE,
  given_by UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  helpful_aspects TEXT[],
  improvement_areas TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, given_by)
);

-- Enable RLS on session_feedback
ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_feedback
CREATE POLICY "Users can view feedback for their sessions"
ON public.session_feedback
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.mentoring_sessions 
    WHERE mentor_id = auth.uid() OR mentee_id = auth.uid()
  )
);

CREATE POLICY "Users can create feedback for their sessions"
ON public.session_feedback
FOR INSERT
WITH CHECK (
  auth.uid() = given_by AND
  session_id IN (
    SELECT id FROM public.mentoring_sessions 
    WHERE mentor_id = auth.uid() OR mentee_id = auth.uid()
  )
);

-- Create mentor_availability table
CREATE TABLE IF NOT EXISTS public.mentor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on mentor_availability
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_availability
CREATE POLICY "Anyone can view mentor availability"
ON public.mentor_availability
FOR SELECT
USING (true);

CREATE POLICY "Mentors can manage their availability"
ON public.mentor_availability
FOR ALL
USING (auth.uid() = mentor_id);

-- Create mentor_profiles table for mentor-specific data
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  expertise_areas TEXT[],
  years_of_experience INTEGER,
  total_mentees INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  success_stories TEXT[],
  max_mentees INTEGER DEFAULT 5,
  hourly_rate BIGINT,
  is_accepting_mentees BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on mentor_profiles
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_profiles
CREATE POLICY "Anyone can view mentor profiles"
ON public.mentor_profiles
FOR SELECT
USING (true);

CREATE POLICY "Mentors can manage their own profile"
ON public.mentor_profiles
FOR ALL
USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_mentorship_relationships_updated_at
BEFORE UPDATE ON public.mentorship_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentoring_sessions_updated_at
BEFORE UPDATE ON public.mentoring_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_availability_updated_at
BEFORE UPDATE ON public.mentor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_profiles_updated_at
BEFORE UPDATE ON public.mentor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update mentor stats when sessions are completed
CREATE OR REPLACE FUNCTION update_mentor_session_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.mentor_profiles
    SET total_sessions = total_sessions + 1
    WHERE user_id = NEW.mentor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_mentor_stats_on_session_complete
AFTER UPDATE ON public.mentoring_sessions
FOR EACH ROW
EXECUTE FUNCTION update_mentor_session_stats();

-- Function to update average rating when feedback is given
CREATE OR REPLACE FUNCTION update_mentor_average_rating()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentor_user_id UUID;
  avg_rating DECIMAL(3,2);
BEGIN
  -- Get the mentor_id from the session
  SELECT mentor_id INTO mentor_user_id
  FROM public.mentoring_sessions
  WHERE id = NEW.session_id;

  -- Calculate new average rating
  SELECT AVG(sf.rating)::DECIMAL(3,2) INTO avg_rating
  FROM public.session_feedback sf
  JOIN public.mentoring_sessions ms ON sf.session_id = ms.id
  WHERE ms.mentor_id = mentor_user_id;

  -- Update mentor profile
  UPDATE public.mentor_profiles
  SET average_rating = COALESCE(avg_rating, 0)
  WHERE user_id = mentor_user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_rating_on_feedback
AFTER INSERT ON public.session_feedback
FOR EACH ROW
EXECUTE FUNCTION update_mentor_average_rating();