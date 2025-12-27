import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, User, Phone, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { countries } from '../../data';
import { useAuth } from '../../context';

interface AuthModalProps {
    onClose: () => void;
}

// Google icon component
function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

export function AuthModal({ onClose }: AuthModalProps) {
    const { isAuthenticated, clearAuthError } = useAuth();
    const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset-sent'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: 'India',
        emailOrPhone: '' // For sign in - can be email or phone
    });

    // Close modal if user becomes authenticated
    useEffect(() => {
        if (isAuthenticated) {
            console.log('✅ User authenticated, closing modal');
            onClose();
        }
    }, [isAuthenticated, onClose]);

    // Handle Email/Password Sign Up
    const handleEmailSignUp = async () => {
        setError(null);

        // Validate form
        if (!formData.name.trim()) {
            setError('Please enter your name.');
            return;
        }
        if (!formData.phone.trim()) {
            setError('Please enter your phone number.');
            return;
        }
        if (!formData.email.trim()) {
            setError('Please enter your email.');
            return;
        }
        if (!formData.password) {
            setError('Please create a password.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            // Sign up with Supabase
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                        phone: formData.phone,
                        country: formData.country
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                    setError('This email is already registered. Please sign in instead.');
                } else {
                    setError(signUpError.message);
                }
                setIsLoading(false);
                return;
            }

            // If user was created, update the profile
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email: formData.email,
                        name: formData.name,
                        phone: formData.phone,
                        country: formData.country,
                        role: 'user'
                    });

                if (profileError) {
                    console.error('Profile update error:', profileError);
                }
            }

            // Success - modal will close automatically when auth state changes
            console.log('✅ Sign up successful');
        } catch (err: any) {
            console.error('Sign up error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Email/Password Sign In
    const handleEmailSignIn = async () => {
        setError(null);

        if (!formData.emailOrPhone.trim()) {
            setError('Please enter your email or phone number.');
            return;
        }
        if (!formData.password) {
            setError('Please enter your password.');
            return;
        }

        setIsLoading(true);

        try {
            let email = formData.emailOrPhone;

            // Check if input looks like a phone number (contains mostly digits)
            const isPhone = /^\+?[\d\s-]{8,}$/.test(formData.emailOrPhone.trim());

            if (isPhone) {
                // Look up email by phone number
                const { data: profiles, error: lookupError } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('phone', formData.emailOrPhone.trim())
                    .single();

                if (lookupError || !profiles?.email) {
                    setError('No account found with this phone number.');
                    setIsLoading(false);
                    return;
                }
                email = profiles.email;
            }

            // Sign in with email
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: formData.password
            });

            if (signInError) {
                if (signInError.message.includes('Invalid login credentials')) {
                    setError('Invalid email/phone or password.');
                } else {
                    setError(signInError.message);
                }
                setIsLoading(false);
                return;
            }

            console.log('✅ Sign in successful');
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Google Sign In
    const handleGoogleSignIn = async () => {
        console.log('🔐 Starting Google sign in, mode:', mode);

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
            // Store profile data for after OAuth callback
            localStorage.setItem('pendingProfile', JSON.stringify({
                name: formData.name,
                phone: formData.phone,
                country: formData.country
            }));
        }

        localStorage.setItem('authMode', mode);
        clearAuthError();
        setIsLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/profile`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account'
                    }
                }
            });

            if (authError) {
                setError(authError.message);
                setIsLoading(false);
                localStorage.removeItem('authMode');
                localStorage.removeItem('pendingProfile');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
            setIsLoading(false);
            localStorage.removeItem('authMode');
            localStorage.removeItem('pendingProfile');
        }
    };

    // Handle Forgot Password
    const handleForgotPassword = async () => {
        setError(null);

        if (!formData.email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                redirectTo: `${window.location.origin}/profile?reset=true`
            });

            if (error) {
                setError(error.message);
            } else {
                setMode('reset-sent');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeSwitch = () => {
        if (mode === 'forgot') {
            setMode('signin');
        } else {
            setMode(mode === 'signin' ? 'signup' : 'signin');
        }
        setError(null);
        clearAuthError();
    };

    return (
        <div className="modal-overlay fixed inset-0" onClick={onClose}>
            <div className="bg-white p-8 md:p-10 rounded-[40px] w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    {(mode === 'forgot' || mode === 'reset-sent') ? (
                        <button onClick={() => setMode('signin')} className="p-2 hover:bg-zinc-100 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <div />
                    )}
                    <h2 className="text-xl font-black uppercase tracking-tighter">
                        {mode === 'signin' && 'Welcome Back'}
                        {mode === 'signup' && 'Create Account'}
                        {mode === 'forgot' && 'Reset Password'}
                        {mode === 'reset-sent' && 'Check Your Email'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Reset Sent Success */}
                {mode === 'reset-sent' && (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-zinc-600 mb-4">
                            We've sent a password reset link to <strong>{formData.email}</strong>
                        </p>
                        <p className="text-zinc-400 text-sm">
                            Check your inbox and click the link to reset your password.
                        </p>
                    </div>
                )}

                {/* Forgot Password Form */}
                {mode === 'forgot' && (
                    <div className="space-y-4">
                        <p className="text-zinc-500 text-sm text-center mb-4">
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <Mail className="w-3 h-3 inline mr-1" /> Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                placeholder="you@example.com"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="font-bold">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleForgotPassword}
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                        </button>
                    </div>
                )}

                {/* Sign In Form */}
                {mode === 'signin' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <Mail className="w-3 h-3 inline mr-1" /> Email or Phone Number
                            </label>
                            <input
                                type="text"
                                value={formData.emailOrPhone}
                                onChange={e => setFormData({ ...formData, emailOrPhone: e.target.value })}
                                className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                placeholder="you@example.com or +91 98765 43210"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <Lock className="w-3 h-3 inline mr-1" /> Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setMode('forgot')}
                            className="text-sm text-zinc-500 hover:text-black font-semibold"
                        >
                            Forgot Password?
                        </button>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="font-bold">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleEmailSignIn}
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-zinc-400">or</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full py-4 px-6 border-2 border-zinc-200 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:border-black transition-colors disabled:opacity-50"
                        >
                            <GoogleIcon />
                            Continue with Google
                        </button>
                    </div>
                )}

                {/* Sign Up Form */}
                {mode === 'signup' && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <User className="w-3 h-3 inline mr-1" /> Full Name *
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
                                <Phone className="w-3 h-3 inline mr-1" /> Phone Number *
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
                                <Mail className="w-3 h-3 inline mr-1" /> Email Address *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                placeholder="you@example.com"
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
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <Lock className="w-3 h-3 inline mr-1" /> Create Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none pr-12"
                                    placeholder="Min 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                <Lock className="w-3 h-3 inline mr-1" /> Confirm Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none pr-12"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="font-bold">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleEmailSignUp}
                            disabled={isLoading}
                            className="w-full py-4 px-6 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-zinc-400">or</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full py-4 px-6 border-2 border-zinc-200 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:border-black transition-colors disabled:opacity-50"
                        >
                            <GoogleIcon />
                            Sign up with Google
                        </button>
                    </div>
                )}

                {/* Toggle Sign In / Sign Up */}
                {mode !== 'reset-sent' && mode !== 'forgot' && (
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
                )}

                <p className="text-center text-xs text-zinc-400 mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
