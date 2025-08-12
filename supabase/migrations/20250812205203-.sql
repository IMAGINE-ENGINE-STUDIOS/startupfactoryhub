-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('startup', 'advisor', 'investor', 'student');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL,
  company_name TEXT,
  position TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  investment_thesis TEXT, -- For investors
  focus_areas TEXT[], -- For investors/advisors
  portfolio_companies TEXT[], -- For investors
  linkedin_url TEXT,
  twitter_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create companies table for startup information
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  stage TEXT,
  founded_year INTEGER,
  team_size INTEGER,
  funding_amount BIGINT,
  logo_url TEXT,
  website TEXT,
  pitch_deck_url TEXT,
  data_room_url TEXT,
  location TEXT,
  tags TEXT[],
  looking_for TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Companies are viewable by everyone"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own company"
  ON public.companies FOR ALL
  USING (auth.uid() = user_id);

-- Create follows table for user connections
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows
CREATE POLICY "Users can view follows"
  ON public.follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow/unfollow"
  ON public.follows FOR ALL
  USING (auth.uid() = follower_id);

-- Create feed posts table
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'update',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  media_urls TEXT[],
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for feed posts
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for feed posts
CREATE POLICY "Feed posts are viewable by everyone"
  ON public.feed_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own posts"
  ON public.feed_posts FOR ALL
  USING (auth.uid() = user_id);

-- Create partners table for homepage carousel
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website TEXT,
  tier TEXT DEFAULT 'standard',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for partners (admin only management)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create policy for partners (public read, admin write)
CREATE POLICY "Partners are viewable by everyone"
  ON public.partners FOR SELECT
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample partner data for carousel
INSERT INTO public.partners (name, logo_url, website, tier, order_index) VALUES
  ('TechCrunch', '/partners/techcrunch.png', 'https://techcrunch.com', 'premium', 1),
  ('Y Combinator', '/partners/ycombinator.png', 'https://ycombinator.com', 'premium', 2),
  ('Sequoia Capital', '/partners/sequoia.png', 'https://sequoiacap.com', 'premium', 3),
  ('Andreessen Horowitz', '/partners/a16z.png', 'https://a16z.com', 'premium', 4),
  ('Google for Startups', '/partners/google.png', 'https://startup.google.com', 'standard', 5),
  ('Microsoft for Startups', '/partners/microsoft.png', 'https://microsoft.com/startups', 'standard', 6);