-- =====================================================
-- COMPLETE AROVAVE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- 1. ADD PERMISSIONS COLUMN TO PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- 2. CREATE ENQUIRIES TABLE (if not exists)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    products JSONB DEFAULT '[]' NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed-win', 'completed-loss', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE INDEX FOR FASTER QUERIES
CREATE INDEX IF NOT EXISTS idx_enquiries_user_id ON public.enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);

-- 4. ENABLE RLS ON ENQUIRIES
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR ENQUIRIES

-- Users can view their own enquiries
DROP POLICY IF EXISTS "Users can view own enquiries" ON public.enquiries;
CREATE POLICY "Users can view own enquiries" ON public.enquiries
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own enquiries
DROP POLICY IF EXISTS "Users can insert own enquiries" ON public.enquiries;
CREATE POLICY "Users can insert own enquiries" ON public.enquiries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all enquiries
DROP POLICY IF EXISTS "Admins can view all enquiries" ON public.enquiries;
CREATE POLICY "Admins can view all enquiries" ON public.enquiries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- Admins can update any enquiry
DROP POLICY IF EXISTS "Admins can update enquiries" ON public.enquiries;
CREATE POLICY "Admins can update enquiries" ON public.enquiries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- 6. RLS POLICIES FOR PROFILES

-- SuperAdmins can update any profile
DROP POLICY IF EXISTS "SuperAdmins can update any profile" ON public.profiles;
CREATE POLICY "SuperAdmins can update any profile" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'superadmin'
        )
    );

-- Allow profiles to be read by their owner or admins
DROP POLICY IF EXISTS "Profiles viewable by owner or admins" ON public.profiles;
CREATE POLICY "Profiles viewable by owner or admins" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- AFTER RUNNING THIS, SET YOURSELF AS SUPER ADMIN:
-- Run this with YOUR email:
-- 
-- UPDATE public.profiles 
-- SET role = 'superadmin' 
-- WHERE email = 'your-email@example.com';
-- =====================================================
