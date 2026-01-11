-- =====================================================
-- ADD TAB CONTENT COLUMNS TO PRODUCTS TABLE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to add the missing columns
-- These columns store the tab content for product detail pages

-- Add tab_description column (if not exists)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tab_description TEXT;

-- Add tab_specifications column (if not exists)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tab_specifications TEXT;

-- Add tab_advantage column (if not exists)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tab_advantage TEXT;

-- Add tab_benefit column (if not exists)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tab_benefit TEXT;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Paste this entire SQL script
-- 6. Click "Run" to execute
-- 7. Done! Tab content fields will now be saved and loaded
-- =====================================================
