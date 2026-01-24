-- Add role-specific profile tables to realtime publication
-- This is required for real-time subscriptions to work

-- Set REPLICA IDENTITY FULL for these tables (required for UPDATE events to include all columns)
ALTER TABLE investor_profiles REPLICA IDENTITY FULL;
ALTER TABLE accelerator_profiles REPLICA IDENTITY FULL;
ALTER TABLE mentor_profiles REPLICA IDENTITY FULL;
ALTER TABLE student_profiles REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
-- Using DO block to handle cases where tables might already be in publication
DO $$
BEGIN
  -- investor_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'investor_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE investor_profiles;
  END IF;
  
  -- accelerator_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'accelerator_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE accelerator_profiles;
  END IF;
  
  -- mentor_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'mentor_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE mentor_profiles;
  END IF;
  
  -- student_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'student_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE student_profiles;
  END IF;
END $$;