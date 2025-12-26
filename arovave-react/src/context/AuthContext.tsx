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
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, name: string, country: string, phone?: string) => Promise<{ error: Error | null }>;
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
    const fetchProfile = async (userId: string): Promise<User | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error('Error fetching profile:', error);
            return null;
        }

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

    // Initialize auth state
    useEffect(() => {
        console.log('🔐 AuthContext initializing...');
        console.log('📍 Current URL:', window.location.href);
        console.log('📍 Hash:', window.location.hash);
        console.log('📍 Search:', window.location.search);

        // Check for tokens in URL hash (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');

        // Check for code in URL query params (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const errorParam = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (errorParam) {
            console.error('❌ Auth Error:', errorParam, errorDescription);
            setIsLoading(false);
            return;
        }

        if (accessToken) {
            console.log('🔑 Found access_token in hash, setting session...');
            // Implicit flow - tokens in hash
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: hashParams.get('refresh_token') || ''
            }).then(({ data: { session }, error }) => {
                if (error) {
                    console.error('❌ Error setting session:', error);
                } else if (session?.user) {
                    console.log('✅ Session set successfully!', session.user.email);
                    setSession(session);
                    setSupabaseUser(session.user);
                    fetchProfile(session.user.id).then(profile => {
                        console.log('👤 Profile fetched:', profile);
                        setCurrentUser(profile);
                    });
                    window.history.replaceState({}, '', window.location.pathname);
                }
                setIsLoading(false);
            });
        } else if (code) {
            console.log('🔑 Found code in query params (PKCE flow), exchanging...');
            // PKCE flow - exchange code for session
            supabase.auth.exchangeCodeForSession(code).then(({ data: { session }, error }) => {
                if (error) {
                    console.error('❌ Error exchanging code:', error);
                } else if (session?.user) {
                    console.log('✅ Session obtained from code!', session.user.email);
                    setSession(session);
                    setSupabaseUser(session.user);
                    fetchProfile(session.user.id).then(profile => {
                        console.log('👤 Profile fetched:', profile);
                        setCurrentUser(profile);
                    });
                    window.history.replaceState({}, '', window.location.pathname);
                }
                setIsLoading(false);
            });
        } else {
            console.log('📦 No tokens in URL, checking for existing session...');
            // Get existing session
            supabase.auth.getSession().then(({ data: { session } }) => {
                console.log('📦 Existing session:', session ? session.user?.email : 'none');
                setSession(session);
                setSupabaseUser(session?.user ?? null);
                if (session?.user) {
                    fetchProfile(session.user.id).then(profile => {
                        console.log('👤 Profile fetched:', profile);
                        setCurrentUser(profile);
                    });
                }
                setIsLoading(false);
            });
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔔 Auth event:', event, session?.user?.email);
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

                    const profile = await fetchProfile(session.user.id);
                    console.log('👤 Profile from auth change:', profile);
                    setCurrentUser(profile);
                } else {
                    setCurrentUser(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { error: error as Error | null };
    };

    // Sign up new user with email and password
    const signUp = async (email: string, password: string, name: string, country: string, phone?: string) => {
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    country,
                    phone
                }
            }
        });

        if (authError) {
            return { error: authError as Error };
        }

        return { error: null };
    };

    // Logout
    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSupabaseUser(null);
        setSession(null);
    };

    // Update profile
    const updateProfile = async (data: Partial<User>) => {
        if (!currentUser?.id) {
            return { error: new Error('No user logged in') };
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                name: data.name,
                phone: data.phone,
                country: data.country
            })
            .eq('id', currentUser.id);

        if (!error) {
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
            isAuthenticated: !!currentUser,
            isLoading,
            isAdmin,
            isSuperAdmin,
            signIn,
            signUp,
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
