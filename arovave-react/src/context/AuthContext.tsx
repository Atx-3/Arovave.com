import { createContext, useContext, useState, useEffect } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    // Start with isLoading FALSE - page loads immediately
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Start with false!
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
                console.error('❌ Error fetching profile:', error);
                if (userEmail) {
                    return {
                        id: userId,
                        name: '',
                        email: userEmail,
                        phone: '',
                        country: '',
                        role: 'user',
                        permissions: [],
                        joined: new Date().toISOString().split('T')[0]
                    };
                }
                return null;
            }

            console.log('✅ Profile data:', data);

            return {
                id: data.id,
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                country: data.country || '',
                role: data.role || 'user',
                permissions: data.permissions || [],
                joined: data.created_at?.split('T')[0]
            };
        } catch (err) {
            console.error('Profile fetch error:', err);
            return null;
        }
    };

    // Handle user session
    const handleSession = async (newSession: Session | null) => {
        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);

        if (newSession?.user) {
            // Handle pending profile from signup
            const pendingProfile = localStorage.getItem('pendingProfile');
            if (pendingProfile) {
                try {
                    const profileData = JSON.parse(pendingProfile);
                    console.log('📝 Updating profile with signup data:', profileData);
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
                    console.error('Error updating profile with signup data:', err);
                }
            }

            const profile = await fetchProfile(newSession.user.id, newSession.user.email);
            setCurrentUser(profile);
        } else {
            setCurrentUser(null);
        }

        // Clear auth mode
        localStorage.removeItem('authMode');
    };

    // Initialize auth state - DON'T wait for getSession, use listener only
    useEffect(() => {
        console.log('🔐 AuthContext initializing...');

        // Listen for auth changes - this is the ONLY way we handle auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('🔔 Auth state changed:', event, newSession?.user?.email);
                await handleSession(newSession);
            }
        );

        // Check for existing session in background (non-blocking)
        supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
            console.log('� Existing session:', existingSession ? existingSession.user?.email : 'none');
            if (existingSession) {
                handleSession(existingSession);
            }
        }).catch(err => {
            console.error('getSession error (ignored):', err);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Logout
    const logout = async () => {
        console.log('🚪 Logging out...');
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSupabaseUser(null);
        setSession(null);
        setAuthError(null);
        console.log('✅ Logged out successfully');
    };

    // Update profile
    const updateProfile = async (data: Partial<User>) => {
        const userId = currentUser?.id || supabaseUser?.id;
        if (!userId) {
            return { error: new Error('No user logged in') };
        }

        console.log('📝 Updating profile for:', userId, data);

        const { error } = await supabase
            .from('profiles')
            .update({
                name: data.name,
                phone: data.phone,
                country: data.country
            })
            .eq('id', userId);

        if (error) {
            console.error('❌ Error updating profile:', error);
        } else {
            console.log('✅ Profile updated!');
            setCurrentUser(prev => prev ? { ...prev, ...data } : null);
        }

        return { error: error as Error | null };
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
            hasPermission
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
