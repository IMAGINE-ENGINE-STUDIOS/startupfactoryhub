-- Drop existing policies that conflict and recreate them
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create RLS policies for profiles (allow guest access)
CREATE POLICY "Anyone can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can modify their profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample data for guest access
INSERT INTO public.profiles (email, full_name, role, company_name, bio, location) VALUES
('john@techstartup.com', 'John Smith', 'startup', 'TechStartup Inc', 'Building the future of AI', 'San Francisco, CA'),
('sarah@advisor.com', 'Sarah Johnson', 'advisor', 'Venture Partners', 'Experienced startup advisor with 15+ exits', 'New York, NY'),
('mike@fund.com', 'Mike Chen', 'investor', 'Growth Capital', 'Series A/B investor focused on SaaS', 'Austin, TX'),
('emma@university.edu', 'Emma Davis', 'student', 'Stanford University', 'Computer Science student passionate about startups', 'Palo Alto, CA')
ON CONFLICT (email) DO NOTHING;