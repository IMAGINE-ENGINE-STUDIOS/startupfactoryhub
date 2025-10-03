-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructor_id UUID,
  instructor_name TEXT,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  category TEXT NOT NULL,
  duration_hours DECIMAL(5,2),
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT true,
  price BIGINT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Anyone can view published courses"
ON public.courses
FOR SELECT
USING (is_published = true);

CREATE POLICY "Instructors can manage their courses"
ON public.courses
FOR ALL
USING (auth.uid() = instructor_id);

-- Create course_modules table
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  resources JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on course_modules
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_modules
CREATE POLICY "Anyone can view modules of published courses"
ON public.course_modules
FOR SELECT
USING (
  course_id IN (SELECT id FROM public.courses WHERE is_published = true)
);

CREATE POLICY "Course instructors can manage modules"
ON public.course_modules
FOR ALL
USING (
  course_id IN (SELECT id FROM public.courses WHERE instructor_id = auth.uid())
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  certificate_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable RLS on course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_enrollments
CREATE POLICY "Students can view their enrollments"
ON public.course_enrollments
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll in courses"
ON public.course_enrollments
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their enrollments"
ON public.course_enrollments
FOR UPDATE
USING (auth.uid() = student_id);

-- Create module_progress table
CREATE TABLE IF NOT EXISTS public.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, module_id)
);

-- Enable RLS on module_progress
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for module_progress
CREATE POLICY "Students can view their module progress"
ON public.module_progress
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can manage their module progress"
ON public.module_progress
FOR ALL
USING (auth.uid() = student_id);

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  certificate_url TEXT,
  verification_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable RLS on certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certificates
CREATE POLICY "Anyone can verify certificates by code"
ON public.certificates
FOR SELECT
USING (true);

CREATE POLICY "Students can view their certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = student_id);

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  skills TEXT[],
  interests TEXT[],
  total_courses_completed INTEGER DEFAULT 0,
  total_certificates INTEGER DEFAULT 0,
  learning_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on student_profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_profiles
CREATE POLICY "Students can view their profile"
ON public.student_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can manage their profile"
ON public.student_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view student profiles"
ON public.student_profiles
FOR SELECT
USING (true);

-- Create course_reviews table
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Enable RLS on course_reviews
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_reviews
CREATE POLICY "Anyone can view course reviews"
ON public.course_reviews
FOR SELECT
USING (true);

CREATE POLICY "Students can create reviews"
ON public.course_reviews
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their reviews"
ON public.course_reviews
FOR UPDATE
USING (auth.uid() = student_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at
BEFORE UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at
BEFORE UPDATE ON public.module_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_reviews_updated_at
BEFORE UPDATE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update course enrollment progress
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_modules INTEGER;
  completed_modules INTEGER;
  progress_pct INTEGER;
BEGIN
  -- Get total modules for the course
  SELECT COUNT(*) INTO total_modules
  FROM public.course_modules
  WHERE course_id = NEW.course_id;

  -- Get completed modules for this student
  SELECT COUNT(*) INTO completed_modules
  FROM public.module_progress
  WHERE student_id = NEW.student_id 
    AND course_id = NEW.course_id 
    AND completed = true;

  -- Calculate percentage
  IF total_modules > 0 THEN
    progress_pct := (completed_modules * 100) / total_modules;
  ELSE
    progress_pct := 0;
  END IF;

  -- Update enrollment progress
  UPDATE public.course_enrollments
  SET 
    progress_percentage = progress_pct,
    completed_at = CASE WHEN progress_pct = 100 THEN now() ELSE NULL END,
    certificate_issued = CASE WHEN progress_pct = 100 THEN true ELSE false END,
    updated_at = now()
  WHERE student_id = NEW.student_id AND course_id = NEW.course_id;

  -- If course is completed, issue certificate
  IF progress_pct = 100 THEN
    INSERT INTO public.certificates (student_id, course_id, verification_code)
    VALUES (
      NEW.student_id, 
      NEW.course_id, 
      'CERT-' || substring(md5(random()::text), 1, 10)
    )
    ON CONFLICT (student_id, course_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_progress_on_module_complete
AFTER INSERT OR UPDATE ON public.module_progress
FOR EACH ROW
WHEN (NEW.completed = true)
EXECUTE FUNCTION update_enrollment_progress();

-- Function to update course average rating
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  -- Calculate new average rating
  SELECT AVG(rating)::DECIMAL(3,2) INTO avg_rating
  FROM public.course_reviews
  WHERE course_id = NEW.course_id;

  -- Update course rating
  UPDATE public.courses
  SET rating = COALESCE(avg_rating, 0)
  WHERE id = NEW.course_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_rating_on_review
AFTER INSERT OR UPDATE ON public.course_reviews
FOR EACH ROW
EXECUTE FUNCTION update_course_rating();

-- Function to update student enrollment count on courses
CREATE OR REPLACE FUNCTION update_course_student_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.courses
  SET total_students = (
    SELECT COUNT(*) FROM public.course_enrollments WHERE course_id = NEW.course_id
  )
  WHERE id = NEW.course_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_student_count_on_enrollment
AFTER INSERT ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_course_student_count();