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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<AuthError | null>(null);

    const clearAuthError = () => setAuthError(null);

    // Fetch user profile from Supabase
    const fetchProfile = useCallback(async (userId: string, userEmail?: string): Promise<User | null> => {
        console.log('📝 Fetching profile for user:', userId);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.log('ℹ️ Profile not found or error:', error.message);
                // Return minimal user data if profile doesn't exist yet
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
    }, []);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        if (session?.user) {
            const profile = await fetchProfile(session.user.id, session.user.email);
            setCurrentUser(profile);
        }
    }, [session, fetchProfile]);

    // Initialize auth state
    useEffect(() => {
        console.log('🔐 AuthContext initializing...');
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                // Get existing session
                const { data: { session: existingSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('❌ getSession error:', error);
                    if (isMounted) setIsLoading(false);
                    return;
                }

                console.log('📦 Session found:', existingSession?.user?.email || 'none');

                if (existingSession && isMounted) {
                    setSession(existingSession);
                    setSupabaseUser(existingSession.user);

                    // Apply pending profile data if exists
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
                                .eq('id', existingSession.user.id);
                            localStorage.removeItem('pendingProfile');
                        } catch (err) {
                            console.error('Error applying pending profile:', err);
                        }
                    }

                    // Fetch full profile
                    const profile = await fetchProfile(existingSession.user.id, existingSession.user.email);
                    if (isMounted) setCurrentUser(profile);
                }

                // Clear auth mode on page load
                localStorage.removeItem('authMode');
            } catch (err) {
                console.error('❌ Auth init error:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('🔔 Auth event:', event, newSession?.user?.email || 'no user');

                if (!isMounted) return;

                if (event === 'SIGNED_IN' && newSession) {
                    setSession(newSession);
                    setSupabaseUser(newSession.user);

                    // Apply pending profile if exists
                    const pendingProfile = localStorage.getItem('pendingProfile');
                    if (pendingProfile) {
                        try {
                            const profileData = JSON.parse(pendingProfile);
                            console.log('📝 Applying pending profile after sign in:', profileData.name);
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
                    if (isMounted) {
                        setCurrentUser(profile);
                        setIsLoading(false);
                    }

                    localStorage.removeItem('authMode');
                } else if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setSupabaseUser(null);
                    setCurrentUser(null);
                    setAuthError(null);
                    setIsLoading(false);
                } else if (event === 'TOKEN_REFRESHED' && newSession) {
                    setSession(newSession);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

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
