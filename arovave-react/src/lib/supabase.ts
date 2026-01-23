/**
 * Supabase Client - Simple and Clean
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase configuration!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        // Use PKCE flow for better security and session persistence
        flowType: 'pkce',
        // Persist session in localStorage
        persistSession: true,
        // Store session in localStorage explicitly
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'arovave-auth-token',
        // Auto refresh tokens before they expire
        autoRefreshToken: true,
        // Detect session from URL (for OAuth/magic link callbacks)
        detectSessionInUrl: true
    }
});

console.log('✅ Supabase connected:', supabaseUrl);
