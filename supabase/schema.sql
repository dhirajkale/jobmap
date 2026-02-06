-- JobMap Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  salary_min INTEGER CHECK (salary_min >= 0),
  salary_max INTEGER CHECK (salary_max >= 0),
  location_lat NUMERIC(9, 6) NOT NULL,
  location_lng NUMERIC(9, 6) NOT NULL,
  location_name VARCHAR(255),
  remote_type VARCHAR(20) NOT NULL DEFAULT 'office',
  url TEXT,
  industry VARCHAR(100),
  experience_level VARCHAR(50),
  posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_salary_range CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
  CONSTRAINT valid_remote_type CHECK (remote_type IN ('remote', 'hybrid', 'office'))
);

-- Saved jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'saved',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected')),
  CONSTRAINT unique_user_job UNIQUE(user_id, job_id)
);

-- Job suggestions table (for user submissions)
CREATE TABLE IF NOT EXISTS job_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  salary_min INTEGER CHECK (salary_min >= 0),
  salary_max INTEGER CHECK (salary_max >= 0),
  location_lat NUMERIC(9, 6),
  location_lng NUMERIC(9, 6),
  location_name VARCHAR(255),
  remote_type VARCHAR(20) NOT NULL DEFAULT 'office',
  url TEXT,
  industry VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_suggestion_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
  CONSTRAINT valid_suggestion_remote_type CHECK (remote_type IN ('remote', 'hybrid', 'office')),
  CONSTRAINT valid_suggestion_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_approved ON jobs(is_approved) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_status ON saved_jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_suggestions_user ON job_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_suggestions_status ON job_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin) WHERE is_admin = true;

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON jobs;
DROP POLICY IF EXISTS "Admins can manage jobs" ON jobs;
DROP POLICY IF EXISTS "Users can view own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can insert own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can update own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can delete own saved jobs" ON saved_jobs;
DROP POLICY IF EXISTS "Users can view own suggestions" ON job_suggestions;
DROP POLICY IF EXISTS "Authenticated users can submit suggestions" ON job_suggestions;
DROP POLICY IF EXISTS "Admins can view all suggestions" ON job_suggestions;
DROP POLICY IF EXISTS "Admins can update suggestions" ON job_suggestions;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are created on signup" ON profiles;

-- Jobs policies (public read for approved jobs)
CREATE POLICY "Jobs are viewable by everyone" ON jobs 
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can manage jobs" ON jobs 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Saved jobs policies (users manage their own)
CREATE POLICY "Users can view own saved jobs" ON saved_jobs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs" ON saved_jobs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved jobs" ON saved_jobs 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs" ON saved_jobs 
  FOR DELETE USING (auth.uid() = user_id);

-- Job suggestions policies
CREATE POLICY "Users can view own suggestions" ON job_suggestions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can submit suggestions" ON job_suggestions 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all suggestions" ON job_suggestions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY "Admins can update suggestions" ON job_suggestions 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles are created on signup" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_jobs_updated_at ON saved_jobs;
CREATE TRIGGER update_saved_jobs_updated_at
  BEFORE UPDATE ON saved_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (with secure search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON jobs TO anon, authenticated;
GRANT ALL ON saved_jobs TO authenticated;
GRANT ALL ON job_suggestions TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- Success message
SELECT 'JobMap database schema created successfully!' AS message;
