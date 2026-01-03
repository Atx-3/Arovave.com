import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials exist
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration!');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        flowType: 'implicit',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
});

// Log connection status
console.log('✅ Supabase client initialized:', supabaseUrl);

// Types for database tables
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
    cat: string;
    subcategory: string | null;
    images: string[];
    thumbnail: string | null;
    video: string | null;
    description: string;
    specs: any[];
    key_specs: any[];
    moq: string;
    price_range: string;
    hsn: string;
    certifications: string[];
    is_trending: boolean;
    tab_description: string | null;
    tab_specifications: string | null;
    tab_advantage: string | null;
    tab_benefit: string | null;
    created_at: string;
    updated_at: string;
}
