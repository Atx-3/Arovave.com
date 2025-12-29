-- Create quality_uploads table for certificates, plant photos, and product samples
CREATE TABLE IF NOT EXISTS quality_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    subcategory_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('certificate', 'plant', 'sample')),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quality_uploads_lookup ON quality_uploads(category_id, subcategory_id, content_type);

-- Enable RLS
ALTER TABLE quality_uploads ENABLE ROW LEVEL SECURITY;

-- Everyone can read quality uploads
CREATE POLICY "Anyone can read quality_uploads" ON quality_uploads FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert quality_uploads" ON quality_uploads FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'superadmin'))
);

CREATE POLICY "Admins can update quality_uploads" ON quality_uploads FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'superadmin'))
);

CREATE POLICY "Admins can delete quality_uploads" ON quality_uploads FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role::text IN ('admin', 'superadmin'))
);
