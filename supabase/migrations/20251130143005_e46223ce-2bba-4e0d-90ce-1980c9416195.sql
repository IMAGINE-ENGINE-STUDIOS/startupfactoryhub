-- Add resume_url column to profiles table for storing user resumes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;