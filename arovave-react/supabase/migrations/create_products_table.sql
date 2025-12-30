-- =====================================================
-- PRODUCTS TABLE MIGRATION FOR SUPABASE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create the products table
-- This enables products to sync across all devices

-- Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cat TEXT NOT NULL,
    subcategory TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    thumbnail TEXT,
    video TEXT,
    description TEXT,
    specs JSONB DEFAULT '[]'::jsonb,
    key_specs JSONB DEFAULT '[]'::jsonb,
    moq TEXT,
    price_range TEXT,
    hsn TEXT,
    certifications JSONB DEFAULT '[]'::jsonb,
    is_trending BOOLEAN DEFAULT false,
    tab_description TEXT,
    tab_specifications TEXT,
    tab_advantage TEXT,
    tab_benefit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read products (public catalog)
CREATE POLICY "Products are viewable by everyone" 
    ON public.products 
    FOR SELECT 
    USING (true);

-- Policy: Allow authenticated admins to insert products
CREATE POLICY "Admins can insert products" 
    ON public.products 
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated admins to update products
CREATE POLICY "Admins can update products" 
    ON public.products 
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated admins to delete products
CREATE POLICY "Admins can delete products" 
    ON public.products 
    FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Create index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_products_cat ON public.products(cat);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_is_trending ON public.products(is_trending);

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Go to your Supabase Dashboard
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Paste this entire SQL script
-- 5. Click "Run" to execute
-- 6. The products table will be created and ready to use
-- 
-- After running this, your app will automatically:
-- - Sync initial products to Supabase on first load
-- - Save new products to Supabase
-- - Fetch products from Supabase on all devices
-- =====================================================
