-- Phase 1.1: Remove deprecated role column from profiles table
-- This prevents privilege escalation attacks by centralizing role management in user_roles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;