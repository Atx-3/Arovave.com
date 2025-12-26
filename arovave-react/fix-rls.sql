-- =====================================================
-- FIX RLS INFINITE RECURSION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop problematic policies first
DROP POLICY IF EXISTS "Profiles viewable by owner or admins" ON public.profiles;
DROP POLICY IF EXISTS "SuperAdmins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all enquiries" ON public.profiles;

-- Create simple, non-recursive policies

-- Everyone can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Insert policy for new profiles (created by trigger)
DROP POLICY IF EXISTS "Profiles can be inserted" ON public.profiles;
CREATE POLICY "Profiles can be inserted" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
