import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, User, Phone, Info, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { countries } from '../../data';
import { useAuth } from '../../context';

interface AuthModalProps {
    onClose: () => void;
}

// Google icon component
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

export function AuthModal({ onClose }: AuthModalProps) {
    const { authError, clearAuthError } = useAuth();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: 'India'
    });

    // Handle auth errors from context
    useEffect(() => {
        if (authError) {
            if (authError.type === 'user_not_found') {
                setMode('signup');
            } else if (authError.type === 'user_exists') {
                setMode('signin');
            }
        }
    }, [authError]);

    // Clear pending data on mount if no auth error
    useEffect(() => {
        const pendingProfile = localStorage.getItem('pendingProfile');
        if (pendingProfile && !authError) {
            const updateProfile = async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const profileData = JSON.parse(pendingProfile);
                        await supabase
                            .from('profiles')
                            .update({
                                name: profileData.name,
                                phone: profileData.phone,
                                country: profileData.country
                            })
                            .eq('id', user.id);
                        localStorage.removeItem('pendingProfile');
                        onClose();
                    }
                } catch (err) {
                    console.error('Error updating profile:', err);
                }
            };
            updateProfile();
        }
    }, [onClose, authError]);

    const handleGoogleSignIn = async () => {
        // For sign up, validate form first
        if (mode === 'signup') {
            if (!formData.name.trim()) {
                setError('Please enter your name.');
                return;
            }
            if (!formData.phone.trim()) {
                setError('Please enter your phone number.');
                return;
            }
            localStorage.setItem('pendingProfile', JSON.stringify(formData));
        }

        // Store auth mode for validation after OAuth return
        localStorage.setItem('authMode', mode);
        clearAuthError();

        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/profile`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account'
                    }
                }
            });

            if (error) {
                console.error('Google sign-in error:', error);
                setError(error.message);
                setIsLoading(false);
                localStorage.removeItem('authMode');
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
            localStorage.removeItem('authMode');
        }
    };

    const handleModeSwitch = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        setError(null);
        clearAuthError();
    };

    return (
        <div className="modal-overlay fixed inset-0" onClick={onClose}>
            <div className="bg-white p-10 rounded-[40px] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Auth Error from Context */}
                {authError?.type === 'user_not_found' && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl text-sm mb-6">
                        <p className="font-bold mb-1">User Not Found</p>
                        <p>No account exists for <span className="font-bold">{authError.email}</span>.</p>
                        <p className="mt-2">Please create an account first.</p>
                        <button
                            onClick={() => { setMode('signup'); clearAuthError(); }}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2"
                        >
                            Create Account <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {authError?.type === 'user_exists' && (
                    <div className="p-4 bg-amber-50 border-2 border-amber-200 text-amber-700 rounded-2xl text-sm mb-6">
                        <p className="font-bold mb-1">Account Already Exists</p>
                        <p>An account already exists for <span className="font-bold">{authError.email}</span>.</p>
                        <p className="mt-2">Please sign in instead.</p>
                        <button
                            onClick={() => { setMode('signin'); clearAuthError(); }}
                            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold text-xs uppercase flex items-center gap-2"
                        >
                            Sign In <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Content */}
                {!authError && (
                    <div className="text-center mb-6">
                        <p className="text-zinc-500 text-sm">
                            {mode === 'signin'
                                ? 'Sign in to manage your enquiries and get personalized quotes.'
                                : 'Fill in your details below, then verify with Google to create your account.'}
                        </p>
                    </div>
                )}

                {/* Sign In Info Box */}
                {mode === 'signin' && !authError && (
                    <div className="p-4 bg-blue-50 rounded-xl text-sm flex items-start gap-3 mb-6">
                        <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                        <p className="text-blue-700">
                            Sign in with your existing Google account. If you're new, please create an account first.
                        </p>
                    </div>
                )}

                {/* Sign Up Form - Name and Phone */}
                {mode === 'signup' && !authError && (
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <User className="w-3 h-3 inline mr-1" />
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                placeholder="John Smith"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <Phone className="w-3 h-3 inline mr-1" />
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                Country *
                            </label>
                            <select
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none bg-white"
                            >
                                {countries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3 mb-6">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="font-bold">{error}</p>
                    </div>
                )}

                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Redirecting to Google...
                        </>
                    ) : (
                        <>
                            <GoogleIcon />
                            {mode === 'signup' ? 'Verify with Google & Create Account' : 'Continue with Google'}
                        </>
                    )}
                </button>

                {/* Toggle Sign In / Sign Up */}
                <p className="text-center text-sm text-zinc-500 mt-6">
                    {mode === 'signin' ? "First time here? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={handleModeSwitch}
                        className="font-bold text-black"
                    >
                        {mode === 'signin' ? 'Create Account' : 'Sign In'}
                    </button>
                </p>

                <p className="text-center text-xs text-zinc-400 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
