import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, type Profile } from '../lib/supabase';
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
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<AuthError | null>(null);

    const clearAuthError = () => setAuthError(null);

    // Fetch user profile from Supabase
    const fetchProfile = async (userId: string, userEmail?: string): Promise<User | null> => {
        console.log('📝 Fetching profile for user:', userId);

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
    };

    // Validate user after OAuth - check if signin/signup mode is correct
    // Returns user existence status but does NOT sign out (that was too aggressive)
    const validateUserAfterOAuth = async (userId: string, userEmail: string): Promise<boolean> => {
        const authMode = localStorage.getItem('authMode') as 'signin' | 'signup' | null;
        localStorage.removeItem('authMode'); // Clear it immediately

        if (!authMode) return true; // No validation needed

        console.log('🔍 Validating user, mode:', authMode);

        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', userId)
            .single();

        const isExistingUser = profile && profile.name && profile.name.trim() !== '';

        if (authMode === 'signin' && !isExistingUser) {
            console.log('⚠️ New user tried to sign in - prompting to complete profile');
            // Don't sign out - let them complete their profile
        }

        if (authMode === 'signup' && isExistingUser) {
            console.log('✅ User already exists - that is fine for OAuth');
            // OAuth is idempotent - existing user signing up again is OK
        }

        // Always allow through - just log for debugging
        return true;
    };

    // Initialize auth state
    useEffect(() => {
        console.log('🔐 AuthContext initializing...');

        const initAuth = async () => {
            try {
                // Just use getSession directly - no artificial timeout
                const { data: { session } } = await supabase.auth.getSession();

                console.log('📦 Initial session:', session ? session.user?.email : 'none');
                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (session?.user) {
                    // Validate user if coming from OAuth
                    await validateUserAfterOAuth(session.user.id, session.user.email || '');

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
                                .eq('id', session.user.id);
                            localStorage.removeItem('pendingProfile');
                        } catch (err) {
                            console.error('Error updating profile with signup data:', err);
                        }
                    }

                    const profile = await fetchProfile(session.user.id, session.user.email);
                    console.log('👤 Profile loaded:', profile);
                    setCurrentUser(profile);
                }
            } catch (err) {
                console.error('❌ Error getting session:', err);
                // Still allow page to render even on error
            } finally {
                // ALWAYS set loading to false so page renders
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔔 Auth state changed:', event, session?.user?.email);
                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (session?.user && event === 'SIGNED_IN') {
                    // Validate user
                    const isValid = await validateUserAfterOAuth(session.user.id, session.user.email || '');
                    if (!isValid) {
                        setIsLoading(false);
                        return;
                    }

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
                                .eq('id', session.user.id);
                            localStorage.removeItem('pendingProfile');
                        } catch (err) {
                            console.error('Error updating profile with signup data:', err);
                        }
                    }

                    const profile = await fetchProfile(session.user.id, session.user.email);
                    console.log('👤 Profile from auth change:', profile);
                    setCurrentUser(profile);
                } else if (!session) {
                    setCurrentUser(null);
                }

                setIsLoading(false);
            }
        );

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
        if (currentUser.role === 'superadmin') return true; // Super admin has all permissions
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
