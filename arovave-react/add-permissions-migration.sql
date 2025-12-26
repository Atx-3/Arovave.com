-- Arovave Database Migration: Add permissions column
-- Run this in Supabase SQL Editor (Database > SQL Editor)

-- Add permissions column to profiles table
-- This stores an array of admin tab permissions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Update RLS policies to allow superadmins to update roles and permissions
DROP POLICY IF EXISTS "SuperAdmins can update any profile" ON public.profiles;

CREATE POLICY "SuperAdmins can update any profile" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Allow superadmins to view all profiles (for admin management)
DROP POLICY IF EXISTS "SuperAdmins can view all profiles" ON public.profiles;

CREATE POLICY "SuperAdmins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- ===========================================
-- IMPORTANT: Set yourself as Super Admin
-- ===========================================
-- After running this migration, run this query 
-- with YOUR email to become Super Admin:
--
-- UPDATE public.profiles 
-- SET role = 'superadmin' 
-- WHERE email = 'your-email@example.com';
-- ===========================================
