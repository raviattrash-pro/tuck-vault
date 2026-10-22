-- ============================================================================
-- Tuck App — Supabase Database Schema
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.tuck_user_data ENABLE ROW LEVEL SECURITY;

-- Allow public read/write if using anon key, or full access for service_role
CREATE POLICY "Allow service role full access" 
  ON public.tuck_user_data
  FOR ALL 
  USING (true)
  WITH CHECK (true);
