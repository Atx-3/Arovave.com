import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, User, Phone, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { countries } from '../data';
import { useAuth } from '../context';

export function AuthPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [mode, setMode] = useState<'signin' | 'signup' | 'verify-signup' | 'forgot' | 'verify-reset' | 'new-password'>('signin');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        country: 'India',
        emailOrPhone: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    // Store pending signup data for after OTP verification
    const [pendingSignupData, setPendingSignupData] = useState<{
        email: string;
        password: string;
        name: string;
        phone: string;
        country: string;
    } | null>(null);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/profile');
        }
    }, [isAuthenticated, navigate]);

    // Handle OTP input
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otpCode];
        newOtp[index] = value.slice(-1); // Only keep last digit
        setOtpCode(newOtp);

        // Auto-focus next input
        if (value && index < 7) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
        const newOtp = [...otpCode];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtpCode(newOtp);
        // Focus last filled input or first empty
        const lastIndex = Math.min(pastedData.length, 7);
        otpRefs.current[lastIndex]?.focus();
    };

    // Handle Email/Password Sign Up - Step 1: Send OTP
    const handleEmailSignUp = async () => {
        setError(null);
        setSuccess(null);

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
            // First check if the email already exists in profiles (case-insensitive)
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('email')
                .ilike('email', formData.email.trim())
                .maybeSingle();

            if (existingProfile) {
                setError('This email is already registered. Please sign in instead.');
                setIsLoading(false);
                return;
            }

            // Also check if user exists in auth by trying to send OTP with shouldCreateUser: false
            // If it succeeds without error, user already exists in auth
            const { error: existsCheck } = await supabase.auth.signInWithOtp({
                email: formData.email.trim(),
                options: {
                    shouldCreateUser: false
                }
            });

            // If no error, it means user exists in auth (OTP was sent to existing user)
            if (!existsCheck) {
                setError('This email is already registered. Please sign in instead.');
                setIsLoading(false);
                return;
            }

            // If we get here, user doesn't exist - now create them
            const { error: signUpError } = await supabase.auth.signInWithOtp({
                email: formData.email.trim(),
                options: {
                    shouldCreateUser: true,
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

            // Store signup data for after verification
            setPendingSignupData({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                country: formData.country
            });

            setOtpCode(['', '', '', '', '', '', '', '']);
            setMode('verify-signup');
            setSuccess(`We've sent an 8-digit code to ${formData.email}`);
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP Verification for Sign Up
    const handleVerifySignUp = async () => {
        setError(null);
        setSuccess(null);

        const code = otpCode.join('');
        if (code.length !== 8) {
            setError('Please enter the complete 8-digit code.');
            return;
        }

        if (!pendingSignupData) {
            setError('Session expired. Please start over.');
            setMode('signup');
            return;
        }

        setIsLoading(true);

        try {
            // Verify OTP
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email: pendingSignupData.email,
                token: code,
                type: 'email'
            });

            if (verifyError) {
                setError('Invalid or expired code. Please try again.');
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Update user password
                await supabase.auth.updateUser({
                    password: pendingSignupData.password
                });

                // Create profile
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: pendingSignupData.email,
                    name: pendingSignupData.name,
                    phone: pendingSignupData.phone,
                    country: pendingSignupData.country,
                    role: 'user'
                });

                // Navigate to profile
                navigate('/profile');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed. Please try again.');
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
            const isPhone = /^\+?[\d\s-]{8,}$/.test(formData.emailOrPhone.trim());

            if (isPhone) {
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
            } else {
                // Success - navigate to profile
                navigate('/profile');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Forgot Password - Send OTP
    const handleForgotPassword = async () => {
        setError(null);
        setSuccess(null);

        if (!formData.email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        setIsLoading(true);

        try {
            // Send OTP for password reset
            const { error } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    shouldCreateUser: false
                }
            });

            if (error) {
                if (error.message.includes('not found') || error.message.includes('invalid')) {
                    setError('No account found with this email.');
                } else {
                    setError(error.message);
                }
            } else {
                setOtpCode(['', '', '', '', '', '', '', '']);
                setMode('verify-reset');
                setSuccess(`We've sent an 8-digit code to ${formData.email}`);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP Verification for Password Reset
    const handleVerifyReset = async () => {
        setError(null);
        setSuccess(null);

        const code = otpCode.join('');
        if (code.length !== 8) {
            setError('Please enter the complete 8-digit code.');
            return;
        }

        setIsLoading(true);

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: formData.email,
                token: code,
                type: 'email'
            });

            if (verifyError) {
                setError('Invalid or expired code. Please try again.');
                setIsLoading(false);
                return;
            }

            // OTP verified, show new password form
            setMode('new-password');
            setSuccess('Code verified! Now create your new password.');
        } catch (err: any) {
            setError(err.message || 'Verification failed.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Setting New Password
    const handleSetNewPassword = async () => {
        setError(null);
        setSuccess(null);

        if (!formData.newPassword) {
            setError('Please enter a new password.');
            return;
        }
        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (formData.newPassword !== formData.confirmNewPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.newPassword
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess('Password updated successfully! Redirecting...');
                setTimeout(() => navigate('/profile'), 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update password.');
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setError(null);
        setIsLoading(true);

        const email = mode === 'verify-signup' ? pendingSignupData?.email : formData.email;
        if (!email) {
            setError('Email not found. Please start over.');
            setMode('signin');
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: mode === 'verify-signup'
                }
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(`New code sent to ${email}`);
                setOtpCode(['', '', '', '', '', '', '', '']);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to resend code.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Panel - Export Theme B&W Design */}
            <div className="hidden lg:flex lg:w-1/2 bg-black relative overflow-hidden">
                {/* Animated export icons - Ship and Airplane */}
                <div className="absolute inset-0">
                    {/* Animated Airplane - flying across */}
                    <div
                        className="absolute top-[20%] cursor-pointer group"
                        style={{ animation: 'flyAcross 15s linear infinite' }}
                    >
                        <svg className="w-20 h-20 text-white/40 group-hover:text-white group-hover:scale-125 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(90deg)' }}>
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                    </div>

                    {/* Large Ship silhouette - floating */}
                    <div
                        className="absolute bottom-[15%] left-[10%] cursor-pointer group"
                        style={{ animation: 'float 8s ease-in-out infinite' }}
                    >
                        <svg className="w-48 h-48 text-white/20 group-hover:text-white/50 transition-all duration-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z" />
                        </svg>
                    </div>

                    {/* Small airplane - different path */}
                    <div
                        className="absolute top-[45%] right-[5%] cursor-pointer group"
                        style={{ animation: 'flyDiagonal 12s linear infinite', animationDelay: '-6s' }}
                    >
                        <svg className="w-12 h-12 text-white/30 group-hover:text-white group-hover:scale-150 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)' }}>
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                    </div>

                    {/* Container/Cargo box icons */}
                    <div
                        className="absolute top-[60%] left-[60%] cursor-pointer group"
                        style={{ animation: 'float 5s ease-in-out infinite', animationDelay: '-2s' }}
                    >
                        <svg className="w-16 h-16 text-white/15 group-hover:text-white/40 transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7zm14 0v-6.7l-6 3.37v6.71l6-3.38z" />
                        </svg>
                    </div>

                    {/* Globe icon */}
                    <div
                        className="absolute top-[25%] right-[25%] cursor-pointer group"
                        style={{ animation: 'spin 30s linear infinite' }}
                    >
                        <svg className="w-24 h-24 text-white/10 group-hover:text-white/30 transition-all duration-500" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </div>

                    {/* Dotted shipping route lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-10">
                        <path d="M0,200 Q200,100 400,150 T800,100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10,10">
                            <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
                        </path>
                        <path d="M0,400 Q300,300 600,350 T1200,250" fill="none" stroke="white" strokeWidth="1" strokeDasharray="5,5">
                            <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="0.8s" repeatCount="indefinite" />
                        </path>
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-16">
                    {/* Top section */}
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Home</span>
                        </Link>
                    </div>

                    {/* Center section */}
                    <div className="text-white">
                        <div className="mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-px bg-white/50"></div>
                                <span className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Welcome to</span>
                            </div>
                            <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-2">
                                AROVAVE
                            </h1>
                            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-6 text-zinc-400">
                                GLOBAL
                            </h2>
                            <p className="text-lg text-zinc-400 max-w-sm leading-relaxed">
                                Your trusted gateway to verified Indian manufacturers. Direct access. Zero middlemen. Premium quality.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-12 mt-12">
                            <div className="group cursor-pointer">
                                <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">25+</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Years</div>
                            </div>
                            <div className="group cursor-pointer">
                                <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">30+</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Products</div>
                            </div>
                            <div className="group cursor-pointer">
                                <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform">50+</div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Countries</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom section - Export categories */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <span className="px-4 py-2 border border-white/20 rounded-full text-sm text-zinc-400 hover:border-white/50 hover:text-white transition-all cursor-default">
                            🏭 Pharma
                        </span>
                        <span className="px-4 py-2 border border-white/20 rounded-full text-sm text-zinc-400 hover:border-white/50 hover:text-white transition-all cursor-default">
                            🍽️ Food
                        </span>
                        <span className="px-4 py-2 border border-white/20 rounded-full text-sm text-zinc-400 hover:border-white/50 hover:text-white transition-all cursor-default">
                            🥃 Glass
                        </span>
                        <span className="px-4 py-2 border border-white/20 rounded-full text-sm text-zinc-400 hover:border-white/50 hover:text-white transition-all cursor-default">
                            🎁 Promo
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-white relative">
                {/* Subtle corner decorations */}
                <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-zinc-100 hidden lg:block"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-zinc-100 hidden lg:block"></div>

                <div className="w-full max-w-md">
                    {/* Mobile Back Link */}
                    <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-zinc-500 hover:text-black mb-8 transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    {/* Logo for mobile */}
                    <div className="lg:hidden mb-8">
                        <h1 className="text-3xl font-black uppercase tracking-tighter">AROVAVE</h1>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-400">GLOBAL</h2>
                        <div className="w-12 h-1 bg-black mt-2"></div>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        {(mode === 'forgot' || mode === 'verify-signup' || mode === 'verify-reset' || mode === 'new-password') && (
                            <button onClick={() => setMode('signin')} className="flex items-center gap-2 text-zinc-500 hover:text-black mb-4 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </button>
                        )}
                        <h2 className="text-3xl font-black uppercase tracking-tighter">
                            {mode === 'signin' && 'Welcome Back'}
                            {mode === 'signup' && 'Create Account'}
                            {mode === 'verify-signup' && 'Verify Email'}
                            {mode === 'forgot' && 'Reset Password'}
                            {mode === 'verify-reset' && 'Enter Code'}
                            {mode === 'new-password' && 'New Password'}
                        </h2>
                        <p className="text-zinc-500 mt-2">
                            {mode === 'signin' && 'Sign in to manage your enquiries and quotes.'}
                            {mode === 'signup' && 'Fill in your details to get started.'}
                            {mode === 'verify-signup' && 'Enter the 8-digit code we sent to your email.'}
                            {mode === 'forgot' && "Enter your email and we'll send you a code."}
                            {mode === 'verify-reset' && 'Enter the 8-digit code we sent to your email.'}
                            {mode === 'new-password' && 'Create a strong new password.'}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-sm flex items-start gap-3 mb-5">
                            <CheckCircle className="w-5 h-5 shrink-0" />
                            <p className="font-semibold">{success}</p>
                        </div>
                    )}

                    {/* OTP Verification Form */}
                    {(mode === 'verify-signup' || mode === 'verify-reset') && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-4">
                                    Enter 8-digit Code
                                </label>
                                <div className="flex gap-2 justify-between">
                                    {otpCode.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            onPaste={handleOtpPaste}
                                            className="w-12 h-14 text-center text-2xl font-bold border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                                        />
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-semibold">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={mode === 'verify-signup' ? handleVerifySignUp : handleVerifyReset}
                                disabled={isLoading || otpCode.join('').length !== 8}
                                className="w-full py-4 px-6 bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                            </button>

                            <p className="text-center text-sm text-zinc-500">
                                Didn't receive the code?{' '}
                                <button onClick={handleResendOtp} disabled={isLoading} className="font-bold text-black hover:underline">
                                    Resend
                                </button>
                            </p>
                        </div>
                    )}

                    {/* New Password Form */}
                    {mode === 'new-password' && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                    <Lock className="w-3 h-3 inline mr-1" /> New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.newPassword}
                                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors pr-12"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                    <Lock className="w-3 h-3 inline mr-1" /> Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.confirmNewPassword}
                                        onChange={e => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors pr-12"
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-semibold">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleSetNewPassword}
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Set New Password
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Forgot Password Form */}
                    {mode === 'forgot' && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors"
                                    placeholder="you@example.com"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-semibold">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleForgotPassword}
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
                            </button>
                        </div>
                    )}

                    {/* Sign In Form */}
                    {mode === 'signin' && (
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                    <Mail className="w-3 h-3 inline mr-1" /> Email or Phone
                                </label>
                                <input
                                    type="text"
                                    value={formData.emailOrPhone}
                                    onChange={e => setFormData({ ...formData, emailOrPhone: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors"
                                    placeholder="you@example.com or +91 98765 43210"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                    <Lock className="w-3 h-3 inline mr-1" /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setMode('forgot')}
                                className="text-sm text-zinc-500 hover:text-black font-semibold transition-colors"
                            >
                                Forgot Password?
                            </button>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-semibold">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleEmailSignIn}
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-sm text-zinc-500 mt-8">
                                Don't have an account?{' '}
                                <button onClick={() => { setMode('signup'); setError(null); }} className="font-bold text-black hover:underline">
                                    Create Account
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Sign Up Form */}
                    {mode === 'signup' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                        <User className="w-3 h-3 inline mr-1" /> Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors"
                                        placeholder="John Smith"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                        <Phone className="w-3 h-3 inline mr-1" /> Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                    <Mail className="w-3 h-3 inline mr-1" /> Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                    Country *
                                </label>
                                <select
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors bg-white cursor-pointer"
                                >
                                    {countries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                        <Lock className="w-3 h-3 inline mr-1" /> Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors pr-10"
                                            placeholder="Min 6 chars"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                        <Lock className="w-3 h-3 inline mr-1" /> Confirm *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-4 border-2 border-zinc-200 rounded-2xl font-semibold focus:border-black focus:outline-none transition-colors pr-10"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-semibold">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleEmailSignUp}
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-black text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Create Account
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-sm text-zinc-500 mt-6">
                                Already have an account?{' '}
                                <button onClick={() => { setMode('signin'); setError(null); }} className="font-bold text-black hover:underline">
                                    Sign In
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Terms */}
                    {!['verify-signup', 'verify-reset', 'new-password'].includes(mode) && (
                        <p className="text-center text-xs text-zinc-400 mt-8">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
