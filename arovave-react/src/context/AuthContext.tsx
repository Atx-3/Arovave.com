import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { setUserProperties } from '../utils/analytics';

// Admin panel tabs
export type AdminPermission = 'enquiries' | 'products' | 'users' | 'settings' | 'quality' | 'categories' | 'support';

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
    const [isLoading, setIsLoading] = useState(true);
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

                // First, set the session in Supabase so RLS works
                await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                // Wait a moment for trigger to create profile
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Use upsert to handle both insert and update cases
                const { error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: payload.sub,
                        email: payload.email,
                        name: profileData.name,
                        phone: profileData.phone,
                        country: profileData.country,
                        role: 'user',
                        permissions: []
                    }, {
                        onConflict: 'id'
                    });

                if (upsertError) {
                    console.error('❌ Profile upsert error:', upsertError);
                } else {
                    console.log('✅ Profile saved successfully');
                }

                localStorage.removeItem('pendingProfile');
            } catch (err) {
                console.error('Error applying pending profile:', err);
            }
        }

        // Fetch profile
        const profile = await fetchProfile(payload.sub, payload.email);
        setCurrentUser(profile);

        // TRACK USER IN ANALYTICS
        if (profile) {
            setUserProperties({
                id: profile.id,
                email: profile.email,
                name: profile.name,
                country: profile.country,
                phone: profile.phone
            });
        }

        // Done loading
        setIsLoading(false);

        // Clear URL hash
        console.log('🧹 Clearing URL hash');
        window.history.replaceState(null, '', window.location.pathname);

        localStorage.removeItem('authMode');
    };

    // Initialize auth
    useEffect(() => {
        console.log('🔐 AuthContext starting...');
        let isMounted = true;

        // Check if URL contains auth tokens first (from OAuth/magic link callbacks)
        const hashParams = getHashParams();
        const hasAuthTokens = !!hashParams.access_token;

        if (hasAuthTokens) {
            console.log('🔑 Found access_token in URL, processing directly...');
            processUserFromToken(hashParams.access_token, hashParams.refresh_token || '');
            return;
        }

        // Set up auth state listener FIRST - this will fire INITIAL_SESSION if there's a stored session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                console.log('🔔 Auth event:', event, newSession?.user?.email || 'no user');

                // Handle initial session on page load (this is key for persistence!)
                if (event === 'INITIAL_SESSION') {
                    if (newSession) {
                        console.log('✅ INITIAL_SESSION: Found stored session for:', newSession.user.email);
                        if (isMounted) {
                            setSession(newSession);
                            setSupabaseUser(newSession.user);

                            // Fetch profile
                            const profile = await fetchProfile(newSession.user.id, newSession.user.email);
                            if (isMounted) {
                                setCurrentUser(profile);
                                setIsLoading(false);
                                if (profile) {
                                    setUserProperties({
                                        id: profile.id,
                                        email: profile.email,
                                        name: profile.name,
                                        country: profile.country,
                                        phone: profile.phone
                                    });
                                }
                            }
                        }
                    } else {
                        console.log('ℹ️ INITIAL_SESSION: No stored session found');
                        if (isMounted) setIsLoading(false);
                    }
                } else if (event === 'SIGNED_IN' && newSession) {
                    console.log('✅ User signed in, updating state...');
                    if (isMounted) {
                        setSession(newSession);
                        setSupabaseUser(newSession.user);

                        // Fetch and set the user profile
                        const profile = await fetchProfile(newSession.user.id, newSession.user.email);
                        if (isMounted) {
                            setCurrentUser(profile);
                            setIsLoading(false);
                            if (profile) {
                                setUserProperties({
                                    id: profile.id,
                                    email: profile.email,
                                    name: profile.name,
                                    country: profile.country,
                                    phone: profile.phone
                                });
                            }
                        }
                    }
                } else if (event === 'TOKEN_REFRESHED' && newSession) {
                    console.log('🔄 Token refreshed');
                    if (isMounted) {
                        setSession(newSession);
                        setSupabaseUser(newSession.user);
                    }
                } else if (event === 'SIGNED_OUT') {
                    console.log('🚪 User signed out');
                    if (isMounted) {
                        setSession(null);
                        setSupabaseUser(null);
                        setCurrentUser(null);
                        setAuthError(null);
                    }
                }
            }
        );

        // Also check getSession as a fallback (in case INITIAL_SESSION doesn't fire)
        const checkSession = async () => {
            console.log('📦 Fallback: Checking getSession()...');
            try {
                const { data: { session: existingSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.log('⚠️ getSession error:', error.message);
                    if (isMounted) setIsLoading(false);
                } else if (existingSession && isMounted) {
                    console.log('✅ getSession found session for:', existingSession.user.email);
                    // Only set if not already set by INITIAL_SESSION
                    setSession(prev => prev || existingSession);
                    setSupabaseUser(prev => prev || existingSession.user);

                    // Use callback to check if currentUser is already set (avoids stale closure)
                    setCurrentUser(prev => {
                        if (!prev) {
                            // Profile not loaded yet, fetch it
                            fetchProfile(existingSession.user.id, existingSession.user.email).then(profile => {
                                if (isMounted) {
                                    setCurrentUser(profile);
                                    setIsLoading(false);
                                }
                            });
                        } else {
                            // Already loaded, just make sure loading is done
                            setIsLoading(false);
                        }
                        return prev;
                    });
                } else {
                    console.log('ℹ️ getSession: No session found');
                    if (isMounted) setIsLoading(false);
                }
            } catch (err) {
                console.error('❌ getSession error:', err);
                if (isMounted) setIsLoading(false);
            }
        };

        // Small delay to let INITIAL_SESSION fire first
        setTimeout(checkSession, 500);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Logout
    const logout = async () => {
        console.log('🚪 Logging out...');

        // Sign out from Supabase FIRST (await it properly!)
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (err) {
            console.error('⚠️ signOut error (continuing anyway):', err);
        }

        // Clear ALL auth-related localStorage items
        localStorage.removeItem('arovave-auth-token');
        // Also clear the sb-* key that processUserFromToken stores
        const sbKey = `sb-${import.meta.env.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0]}-auth-token`;
        localStorage.removeItem(sbKey);
        localStorage.removeItem('pendingProfile');
        localStorage.removeItem('authMode');

        // Clear local state AFTER signOut completes
        setCurrentUser(null);
        setSupabaseUser(null);
        setSession(null);
        setAuthError(null);

        console.log('✅ Logged out completely');
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
