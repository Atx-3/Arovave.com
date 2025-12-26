import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Profile {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    country: string;
    role: 'user' | 'admin' | 'superadmin';
    created_at: string;
}

export interface DbProduct {
    id: number;
    name: string;
    category: string;
    subcategory: string | null;
    hsn: string;
    moq: string;
    price_range: string;
    description: string;
    certifications: string[];
    images: string[];
    video: string | null;
    specs: { label: string; value: string }[];
    is_trending: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbEnquiry {
    id: number;
    user_id: string;
    products: any[];
    status: 'pending' | 'contacted' | 'completed-win' | 'completed-loss' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface DbQualityContent {
    id: number;
    category: string;
    subcategory: string;
    content_type: 'certificate' | 'plant' | 'sample';
    title: string;
    description: string | null;
    image_url: string;
    created_at: string;
}
