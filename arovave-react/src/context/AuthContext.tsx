import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Admin panel tabs
export type AdminPermission = 'enquiries' | 'products' | 'users' | 'settings';

// Extended User type with role and permissions
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    country: string;
    role: 'user' | 'admin' | 'superadmin';
    permissions: AdminPermission[];
    joined?: string;
}

// Auth error types
export interface AuthError {
    type: 'user_exists' | 'user_not_found';
    email: string;
}

interface AuthContextType {
    currentUser: User | null;
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    authError: AuthError | null;
    clearAuthError: () => void;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<{ error: Error | null }>;
    hasPermission: (permission: AdminPermission) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Parse hash params from URL
function getHashParams(): Record<string, string> {
    const hash = window.location.hash.substring(1);
    const params: Record<string, string> = {};
    hash.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[key] = decodeURIComponent(value);
        }
    });
    return params;
}

// Decode JWT token (without verification - just for reading payload)
function decodeJwt(token: string): any {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch (e) {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<AuthError | null>(null);

    const clearAuthError = () => setAuthError(null);

    // Fetch user profile from Supabase
    const fetchProfile = async (userId: string, userEmail?: string): Promise<User | null> => {
        console.log('📝 Fetching profile for user:', userId);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.log('ℹ️ Profile not found, using defaults');
                return {
                    id: userId,
                    name: '',
                    email: userEmail || '',
                    phone: '',
                    country: '',
                    role: 'user',
                    permissions: [],
                    joined: new Date().toISOString().split('T')[0]
                };
            }

            console.log('✅ Profile loaded:', data.email);

            return {
                id: data.id,
                name: data.name || '',
                email: data.email || userEmail || '',
                phone: data.phone || '',
                country: data.country || '',
                role: data.role || 'user',
                permissions: data.permissions || [],
                joined: data.created_at?.split('T')[0]
            };
        } catch (err) {
            console.error('❌ Profile fetch error:', err);
            return null;
        }
    };

    // Refresh user data
    const refreshUser = useCallback(async () => {
        if (session?.user) {
            const profile = await fetchProfile(session.user.id, session.user.email);
            setCurrentUser(profile);
        }
    }, [session]);

    // Process user from token
    const processUserFromToken = async (accessToken: string, refreshToken: string) => {
        console.log('🔓 Decoding token...');

        const payload = decodeJwt(accessToken);
        if (!payload) {
            console.error('❌ Failed to decode token');
            return;
        }

        console.log('✅ Token decoded:', payload.email);

        // Create a minimal session object
        const minimalSession: Session = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: payload.exp,
            expires_in: payload.exp - Math.floor(Date.now() / 1000),
            token_type: 'bearer',
            user: {
                id: payload.sub,
                email: payload.email,
                app_metadata: payload.app_metadata || {},
                user_metadata: payload.user_metadata || {},
                aud: payload.aud,
                created_at: '',
            } as SupabaseUser
        };

        setSession(minimalSession);
        setSupabaseUser(minimalSession.user);

        // Store tokens in localStorage for Supabase to use later
        const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0]}-auth-token`;
        localStorage.setItem(storageKey, JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: payload.exp,
            token_type: 'bearer',
            user: minimalSession.user
        }));

        // Handle pending profile from signup
        const pendingProfile = localStorage.getItem('pendingProfile');
        if (pendingProfile) {
            try {
                const profileData = JSON.parse(pendingProfile);
                console.log('📝 Applying pending profile:', profileData.name);
                await supabase
                    .from('profiles')
                    .update({
                        name: profileData.name,
                        phone: profileData.phone,
                        country: profileData.country
                    })
                    .eq('id', payload.sub);
                localStorage.removeItem('pendingProfile');
            } catch (err) {
                console.error('Error applying pending profile:', err);
            }
        }

        // Fetch profile
        const profile = await fetchProfile(payload.sub, payload.email);
        setCurrentUser(profile);

        // Clear URL hash
        console.log('🧹 Clearing URL hash');
        window.history.replaceState(null, '', window.location.pathname);

        localStorage.removeItem('authMode');
    };

    // Initialize auth
    useEffect(() => {
        console.log('🔐 AuthContext starting...');

        // Check if URL contains auth tokens
        const hashParams = getHashParams();
        const hasAuthTokens = !!hashParams.access_token;

        if (hasAuthTokens) {
            console.log('🔑 Found access_token in URL, processing directly...');
            processUserFromToken(hashParams.access_token, hashParams.refresh_token || '');
            return;
        }

        // Check for stored session in localStorage
        const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0]}-auth-token`;
        const storedSession = localStorage.getItem(storageKey);

        if (storedSession) {
            try {
                const sessionData = JSON.parse(storedSession);
                if (sessionData.access_token && sessionData.expires_at > Math.floor(Date.now() / 1000)) {
                    console.log('📦 Found valid stored session');
                    processUserFromToken(sessionData.access_token, sessionData.refresh_token || '');
                    return;
                } else {
                    console.log('ℹ️ Stored session expired');
                    localStorage.removeItem(storageKey);
                }
            } catch (err) {
                console.error('Error parsing stored session:', err);
            }
        }

        console.log('ℹ️ No session found');

        // Set up auth state listener for future sign-ins
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('🔔 Auth event:', event, newSession?.user?.email || 'no user');

                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setSupabaseUser(null);
                    setCurrentUser(null);
                    setAuthError(null);
                    localStorage.removeItem(storageKey);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Logout
    const logout = async () => {
        console.log('🚪 Logging out...');

        // Clear local state
        setCurrentUser(null);
        setSupabaseUser(null);
        setSession(null);
        setAuthError(null);

        // Clear stored session
        const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0]}-auth-token`;
        localStorage.removeItem(storageKey);

        // Try to sign out from Supabase (don't wait for it)
        supabase.auth.signOut().catch(() => { });

        console.log('✅ Logged out');
    };

    // Update profile
    const updateProfile = async (data: Partial<User>) => {
        const userId = currentUser?.id || supabaseUser?.id;
        if (!userId) {
            return { error: new Error('No user logged in') };
        }

        console.log('📝 Updating profile:', data);

        const { error } = await supabase
            .from('profiles')
            .update({
                name: data.name,
                phone: data.phone,
                country: data.country
            })
            .eq('id', userId);

        if (error) {
            console.error('❌ Profile update error:', error);
            return { error: error as Error };
        }

        console.log('✅ Profile updated');
        setCurrentUser(prev => prev ? { ...prev, ...data } : null);
        return { error: null };
    };

    // Check if user has specific admin permission
    const hasPermission = (permission: AdminPermission): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'superadmin') return true;
        if (currentUser.role === 'admin') {
            return currentUser.permissions.includes(permission);
        }
        return false;
    };

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    const isSuperAdmin = currentUser?.role === 'superadmin';

    return (
        <AuthContext.Provider value={{
            currentUser,
            supabaseUser,
            session,
            isAuthenticated: !!session?.user,
            isLoading,
            isAdmin,
            isSuperAdmin,
            authError,
            clearAuthError,
            logout,
            updateProfile,
            hasPermission,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
