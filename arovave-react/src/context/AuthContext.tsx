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

    // Process session and load profile
    const processSession = async (newSession: Session | null) => {
        console.log('📦 Processing session:', newSession?.user?.email || 'none');

        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);

        if (newSession?.user) {
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
                        .eq('id', newSession.user.id);
                    localStorage.removeItem('pendingProfile');
                } catch (err) {
                    console.error('Error applying pending profile:', err);
                }
            }

            // Fetch profile
            const profile = await fetchProfile(newSession.user.id, newSession.user.email);
            setCurrentUser(profile);

            // Clear URL hash after successful auth
            if (window.location.hash.includes('access_token')) {
                console.log('🧹 Clearing URL hash');
                window.history.replaceState(null, '', window.location.pathname);
            }
        } else {
            setCurrentUser(null);
        }

        localStorage.removeItem('authMode');
    };

    // Initialize auth
    useEffect(() => {
        console.log('🔐 AuthContext starting...');
        let isMounted = true;

        // Check if URL contains auth tokens
        const hashParams = getHashParams();
        const hasAuthTokens = !!hashParams.access_token;

        if (hasAuthTokens) {
            console.log('🔑 Found access_token in URL hash');
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('🔔 Auth event:', event, newSession?.user?.email || 'no user');

                if (!isMounted) return;

                if (newSession) {
                    await processSession(newSession);
                } else if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setSupabaseUser(null);
                    setCurrentUser(null);
                    setAuthError(null);
                }
            }
        );

        // Try to get session with timeout
        const getSessionWithTimeout = async () => {
            console.log('📡 Calling getSession...');

            try {
                // Create a race between getSession and a timeout
                const timeoutPromise = new Promise<null>((resolve) => {
                    setTimeout(() => {
                        console.log('⏱️ getSession timed out after 3 seconds');
                        resolve(null);
                    }, 3000);
                });

                const sessionPromise = supabase.auth.getSession().then(
                    ({ data: { session }, error }) => {
                        if (error) {
                            console.error('❌ getSession error:', error);
                            return null;
                        }
                        return session;
                    }
                );

                const result = await Promise.race([sessionPromise, timeoutPromise]);

                if (result && isMounted) {
                    console.log('✅ Session found:', result.user?.email);
                    await processSession(result);
                } else if (hasAuthTokens && isMounted) {
                    // If we have tokens but getSession failed, try setSession manually
                    console.log('🔄 Trying manual session recovery...');
                    const { data, error } = await supabase.auth.setSession({
                        access_token: hashParams.access_token,
                        refresh_token: hashParams.refresh_token || ''
                    });

                    if (data.session && isMounted) {
                        console.log('✅ Manual session set:', data.session.user?.email);
                        await processSession(data.session);
                    } else if (error) {
                        console.error('❌ Manual session failed:', error);
                    }
                } else {
                    console.log('ℹ️ No session found');
                }
            } catch (err) {
                console.error('❌ Session error:', err);
            }
        };

        getSessionWithTimeout();

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Logout
    const logout = async () => {
        console.log('🚪 Logging out...');
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSupabaseUser(null);
        setSession(null);
        setAuthError(null);
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
