-- ============================================================================
-- Tuck App — Supabase Database Schema & Industry Security Standard
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

-- Create user space data table
CREATE TABLE IF NOT EXISTS public.tuck_user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  user_name TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user lookups by email
CREATE INDEX IF NOT EXISTS idx_tuck_user_email ON public.tuck_user_data (user_email);

-- Enable Row Level Security (RLS) - Industry Standard Practice
ALTER TABLE public.tuck_user_data ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service Role Full Access
-- The Next.js backend API (/api/sync) connects securely using SUPABASE_SERVICE_ROLE_KEY
-- on the server, which has full privileges to read and update verified user spaces.
DROP POLICY IF EXISTS "Allow service role full access" ON public.tuck_user_data;

CREATE POLICY "Allow server-side service role full access" 
  ON public.tuck_user_data
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Prevent unauthenticated anonymous users from scraping user records
-- Direct public browser queries using anon key will be blocked by default unless authorized.
DROP POLICY IF EXISTS "Public Anon Deny All" ON public.tuck_user_data;

CREATE POLICY "Public Anon Deny All"
  ON public.tuck_user_data
  FOR ALL
  TO anon
  USING (false);
