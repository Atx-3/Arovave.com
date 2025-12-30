import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context';
import { supabase } from '../../lib/supabase';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'superadmin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, isAdmin, isSuperAdmin } = useAuth();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle Email sign in with admin check
    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setError('');
        try {
            // First sign in
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;

            // Check if user is admin
            if (data.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
                    // Not an admin - sign out and show error
                    await supabase.auth.signOut();
                    setError('Access Denied - This account does not have admin privileges.');
                    setLoginLoading(false);
                    return;
                }
            }

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
                        </form>

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
