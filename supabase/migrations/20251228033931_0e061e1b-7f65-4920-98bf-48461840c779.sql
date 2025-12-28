-- Enable REPLICA IDENTITY FULL for complete row data in real-time
ALTER TABLE mentor_profiles REPLICA IDENTITY FULL;
ALTER TABLE advisor_skills REPLICA IDENTITY FULL;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE mentor_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE advisor_skills;

-- Add industry column to profiles table if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;

-- Create user_goals table for storing selected goals during signup
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id TEXT NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, goal_id)
);

-- Enable RLS
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own goals
CREATE POLICY "Users can manage own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable real-time for user_goals
ALTER TABLE user_goals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE user_goals;