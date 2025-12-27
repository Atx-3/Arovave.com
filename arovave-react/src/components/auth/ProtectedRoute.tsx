import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { supabase } from '../../lib/supabase';
import { Loader2, Lock, ShieldAlert, LogIn } from 'lucide-react';
import { useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'superadmin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, isAdmin, isSuperAdmin } = useAuth();
    const location = useLocation();
    const [showEmailLogin, setShowEmailLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle Google sign in
    const handleGoogleSignIn = async () => {
        setLoginLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/admin/dashboard`
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google sign in failed');
            setLoginLoading(false);
        }
    };

    // Handle Email sign in
    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            // Page will reload with new session
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Login failed');
            setLoginLoading(false);
        }
    };

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-zinc-400 mx-auto mb-4" />
                    <p className="text-zinc-500 text-sm">Checking authorization...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login prompt
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 to-white px-6">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 p-10">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Admin Access Required</h1>
                            <p className="text-zinc-500 text-sm">
                                Please sign in with an authorized admin account to access the dashboard.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6">
                                {error}
                            </div>
                        )}

                        {!showEmailLogin ? (
                            <div className="space-y-4">
                                <button
                                    onClick={handleGoogleSignIn}
                                    disabled={loginLoading}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-zinc-200 rounded-xl font-bold text-sm hover:border-black transition-colors disabled:opacity-50"
                                >
                                    {loginLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    Sign in with Google
                                </button>
                                <button
                                    onClick={() => setShowEmailLogin(true)}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                                >
                                    <LogIn className="w-5 h-5" />
                                    Sign in with Email
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleEmailSignIn} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none"
                                        placeholder="admin@arovave.com"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loginLoading}
                                    className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                >
                                    {loginLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEmailLogin(false)}
                                    className="w-full py-3 text-zinc-500 text-sm hover:text-black transition-colors"
                                >
                                    ← Back to options
                                </button>
                            </form>
                        )}

                        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
                            <Link to="/" className="text-zinc-400 text-sm hover:text-black transition-colors">
                                ← Back to Homepage
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated but wrong role - show access denied
    if (requiredRole === 'superadmin' && !isSuperAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-50">
                <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-10 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Access Denied</h1>
                    <p className="text-zinc-500 mb-8">You need Super Admin privileges to access this page.</p>
                    <Link to="/" className="inline-block px-8 py-4 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    if (requiredRole === 'admin' && !isAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-zinc-50">
                <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 p-10 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter mb-4">Access Denied</h1>
                    <p className="text-zinc-500 mb-8">
                        Your account doesn't have Admin privileges. Contact a Super Admin to get access.
                    </p>
                    <Link to="/" className="inline-block px-8 py-4 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
