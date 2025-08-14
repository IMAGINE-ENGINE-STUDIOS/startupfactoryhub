-- Create profiles table with proper structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'startup',
  avatar_url TEXT,
  company_name TEXT,
  position TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  focus_areas TEXT[],
  portfolio_companies TEXT[],
  investment_thesis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles (allow guest access)
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Update companies table policies for guest access
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
CREATE POLICY "Anyone can view companies" ON public.companies
  FOR SELECT USING (true);

-- Update feed_posts table policies for guest access
DROP POLICY IF EXISTS "Feed posts are viewable by everyone" ON public.feed_posts;
CREATE POLICY "Anyone can view feed posts" ON public.feed_posts
  FOR SELECT USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'startup')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for guest access
INSERT INTO public.profiles (email, full_name, role, company_name, bio, location) VALUES
('john@techstartup.com', 'John Smith', 'startup', 'TechStartup Inc', 'Building the future of AI', 'San Francisco, CA'),
('sarah@advisor.com', 'Sarah Johnson', 'advisor', 'Venture Partners', 'Experienced startup advisor with 15+ exits', 'New York, NY'),
('mike@fund.com', 'Mike Chen', 'investor', 'Growth Capital', 'Series A/B investor focused on SaaS', 'Austin, TX'),
('emma@university.edu', 'Emma Davis', 'student', 'Stanford University', 'Computer Science student passionate about startups', 'Palo Alto, CA')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.companies (name, description, industry, stage, location, funding_amount, user_id) VALUES
('AI Vision', 'Computer vision platform for autonomous vehicles', 'AI/ML', 'Series A', 'San Francisco, CA', 5000000, (SELECT id FROM public.profiles WHERE email = 'john@techstartup.com' LIMIT 1)),
('FinTech Pro', 'Digital banking solution for SMBs', 'FinTech', 'Seed', 'New York, NY', 2000000, (SELECT id FROM public.profiles WHERE email = 'john@techstartup.com' LIMIT 1)),
('EduTech Labs', 'Online learning platform with AI tutoring', 'EdTech', 'Pre-Seed', 'Boston, MA', 500000, (SELECT id FROM public.profiles WHERE email = 'john@techstartup.com' LIMIT 1))
ON CONFLICT DO NOTHING;

INSERT INTO public.feed_posts (content, user_id, post_type) VALUES
('Excited to announce our Series A funding! 🚀', (SELECT id FROM public.profiles WHERE email = 'john@techstartup.com' LIMIT 1), 'announcement'),
('Looking for talented engineers to join our team', (SELECT id FROM public.profiles WHERE email = 'john@techstartup.com' LIMIT 1), 'hiring'),
('Just closed another amazing deal with our portfolio company', (SELECT id FROM public.profiles WHERE email = 'sarah@advisor.com' LIMIT 1), 'update')
ON CONFLICT DO NOTHING;