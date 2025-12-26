import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, type Profile } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Extended User type with role
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    country: string;
    role: 'user' | 'admin' | 'superadmin';
    joined?: string;
}

interface AuthContextType {
    currentUser: User | null;
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
            // If profile doesn't exist, return a basic user object from session
            if (userEmail) {
                return {
                    id: userId,
                    name: '',
                    email: userEmail,
                    phone: '',
                    country: '',
                    role: 'user',
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
            joined: data.created_at?.split('T')[0]
        };
    };

    // Initialize auth state - let Supabase handle everything
    useEffect(() => {
        console.log('🔐 AuthContext initializing...');

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('📦 Initial session:', session ? session.user?.email : 'none');
            setSession(session);
            setSupabaseUser(session?.user ?? null);

            if (session?.user) {
                fetchProfile(session.user.id, session.user.email).then(profile => {
                    console.log('👤 Profile loaded:', profile);
                    setCurrentUser(profile);
                    setIsLoading(false);
                });
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔔 Auth state changed:', event, session?.user?.email);
                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (session?.user) {
                    // Check if we have pending profile data from signup
                    const pendingProfile = localStorage.getItem('pendingProfile');
                    if (pendingProfile && event === 'SIGNED_IN') {
                        try {
                            const profileData = JSON.parse(pendingProfile);
                            console.log('📝 Updating profile with signup data:', profileData);

                            // Update the profile with signup data
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
                } else {
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
            logout,
            updateProfile
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
