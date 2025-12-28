import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings, LogOut, Save, Edit2, X, Mail, Phone, MapPin, Calendar, HelpCircle, MessageSquare, FileText, Shield, ChevronRight, Loader2, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth, useTranslation } from '../context';
import { useState, useEffect, useRef } from 'react';
import { AuthModal } from '../components/auth/AuthModal';
import { countries } from '../data';
import { supabase } from '../lib/supabase';

export function Profile() {
    const { currentUser, supabaseUser, isAuthenticated, isLoading, isAdmin, logout, updateProfile } = useAuth();
    const t = useTranslation();
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        country: ''
    });

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordChangeStep, setPasswordChangeStep] = useState<'request' | 'verify' | 'newpass'>('request');
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '', '', '']);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Debug log
    useEffect(() => {
        console.log('🖼️ Profile render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    }, [isLoading, isAuthenticated]);

    // Get display values with fallbacks
    const displayName = currentUser?.name || supabaseUser?.user_metadata?.full_name || supabaseUser?.user_metadata?.name || 'User';
    const displayEmail = currentUser?.email || supabaseUser?.email || '';
    const displayPhone = currentUser?.phone || '';
    const displayCountry = currentUser?.country || '';
    const displayJoined = currentUser?.joined || new Date().toISOString().split('T')[0];
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

    // Load user data into form
    useEffect(() => {
        if (currentUser || supabaseUser) {
            setEditForm({
                name: displayName,
                email: displayEmail,
                phone: displayPhone,
                country: displayCountry
            });
        }
    }, [currentUser, supabaseUser]);

    const handleSave = async () => {
        setIsSaving(true);
        if (updateProfile) {
            await updateProfile(editForm);
        }
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        setIsEditing(false);
    };

    // OTP Input handlers
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otpCode];
        newOtp[index] = value.slice(-1);
        setOtpCode(newOtp);
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
        const lastIndex = Math.min(pastedData.length, 7);
        otpRefs.current[lastIndex]?.focus();
    };

    // Step 1: Request OTP for password change
    const handleRequestPasswordOtp = async () => {
        setPasswordError(null);
        setPasswordChanging(true);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: displayEmail,
                options: {
                    shouldCreateUser: false
                }
            });

            if (error) {
                setPasswordError(error.message);
            } else {
                setOtpCode(['', '', '', '', '', '', '', '']);
                setPasswordChangeStep('verify');
            }
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to send verification code.');
        } finally {
            setPasswordChanging(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyPasswordOtp = async () => {
        setPasswordError(null);
        const code = otpCode.join('');

        if (code.length !== 8) {
            setPasswordError('Please enter the complete 8-digit code.');
            return;
        }

        setPasswordChanging(true);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email: displayEmail,
                token: code,
                type: 'email'
            });

            if (error) {
                setPasswordError('Invalid or expired code. Please try again.');
            } else {
                setPasswordChangeStep('newpass');
            }
        } catch (err: any) {
            setPasswordError(err.message || 'Verification failed.');
        } finally {
            setPasswordChanging(false);
        }
    };

    // Step 3: Set new password
    const handlePasswordChange = async () => {
        setPasswordError(null);

        if (!passwordForm.newPassword) {
            setPasswordError('Please enter a new password.');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }

        setPasswordChanging(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordForm.newPassword
            });

            if (error) {
                setPasswordError(error.message);
            } else {
                setPasswordSuccess(true);
                setPasswordForm({ newPassword: '', confirmPassword: '' });
                setTimeout(() => {
                    setPasswordSuccess(false);
                    setShowPasswordChange(false);
                    setPasswordChangeStep('request');
                }, 2000);
            }
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to update password.');
        } finally {
            setPasswordChanging(false);
        }
    };

    // Reset password change modal state when closed
    const closePasswordModal = () => {
        setShowPasswordChange(false);
        setPasswordChangeStep('request');
        setPasswordError(null);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setOtpCode(['', '', '', '', '', '', '', '']);
    };

    // No loading check needed - isLoading is always false now

    // Redirect to auth page if not authenticated (using useEffect to avoid race condition)
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth');
        }
    }, [isAuthenticated, navigate]);

    // Show nothing briefly while checking auth state
    if (!isAuthenticated) {
        return (
            <div className="page-enter max-w-4xl mx-auto px-6 py-12 flex items-center justify-center min-h-[50vh]">
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-zinc-200 rounded-lg mb-4"></div>
                    <div className="h-4 w-32 bg-zinc-100 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-enter max-w-4xl mx-auto px-6 py-12">
            {/* Page Header with Gradient Accent */}
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">{t('profile')}</h1>
                <div className="h-1.5 w-16 bg-gradient-to-r from-black to-zinc-400 rounded-full"></div>
            </div>

            {/* Success Message */}
            {saveSuccess && (
                <div className="success-toast mb-6 p-5 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-black">Profile updated successfully!</p>
                        <p className="text-sm text-zinc-500">Your changes have been saved.</p>
                    </div>
                </div>
            )}

            {/* Premium Profile Card - B&W Export Theme */}
            <div className="bg-black rounded-[32px] p-8 md:p-10 mb-10 text-white relative overflow-hidden">
                {/* Animated export icons background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Flying airplane */}
                    <div
                        className="absolute top-[15%] opacity-30"
                        style={{ animation: 'flyAcross 12s linear infinite' }}
                    >
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" style={{ transform: 'rotate(90deg)' }}>
                            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                        </svg>
                    </div>

                    {/* Ship silhouette */}
                    <div
                        className="absolute bottom-[10%] right-[15%] opacity-10"
                        style={{ animation: 'float 8s ease-in-out infinite', animationDelay: '-3s' }}
                    >
                        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z" />
                        </svg>
                    </div>

                    {/* Globe */}
                    <div
                        className="absolute top-1/2 right-[5%] opacity-5"
                        style={{ animation: 'spin 40s linear infinite' }}
                    >
                        <svg className="w-40 h-40" fill="none" stroke="currentColor" strokeWidth="0.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </div>
                </div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {/* Premium Avatar - B&W */}
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
                            <span className="text-3xl md:text-4xl font-black text-black">{initials}</span>
                        </div>

                        {/* User Info */}
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{displayName}</h2>
                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                    <Mail className="w-3 h-3" />
                                </div>
                                <span>{displayEmail}</span>
                            </div>
                            {displayPhone && (
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <Phone className="w-3 h-3" />
                                    </div>
                                    <span>{displayPhone}</span>
                                </div>
                            )}
                            {displayCountry && (
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <MapPin className="w-3 h-3" />
                                    </div>
                                    <span>{displayCountry}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Button */}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-100 transition-all duration-300 group"
                    >
                        <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        Edit Profile
                    </button>
                </div>

                {/* Member Since Badge */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-400">Member since <span className="text-white font-semibold">{displayJoined}</span></span>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal - Glassmorphism */}
            {isEditing && (
                <div className="modal-overlay fixed inset-0" onClick={() => setIsEditing(false)}>
                    <div className="glass-modal p-8 md:p-10 rounded-[32px] w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Edit Profile</h2>
                                <p className="text-sm text-zinc-500 mt-1">Update your personal information</p>
                            </div>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-3 hover:bg-zinc-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="input-premium w-full px-5 py-4 rounded-xl font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    disabled
                                    className="w-full px-5 py-4 border-2 border-zinc-100 rounded-xl font-semibold bg-zinc-50 text-zinc-400 cursor-not-allowed"
                                />
                                <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Email is protected and cannot be changed
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="input-premium w-full px-5 py-4 rounded-xl font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Country</label>
                                <select
                                    value={editForm.country}
                                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                    className="input-premium w-full px-5 py-4 rounded-xl font-semibold cursor-pointer"
                                >
                                    <option value="">Select country...</option>
                                    {countries.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn-premium flex-1 flex items-center justify-center gap-2 py-4 text-white rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-4 border-2 border-zinc-200 rounded-xl font-bold text-sm hover:border-black hover:bg-zinc-50 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions - Premium Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-10">
                <Link
                    to="/enquiries"
                    className="action-card card-animate stagger-1 flex items-center justify-between p-6 rounded-2xl group"
                >
                    <div className="flex items-center gap-4">
                        <div className="icon-container w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all">
                            <FileText className="w-7 h-7 text-zinc-700 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">My Enquiries</h3>
                            <p className="text-sm text-zinc-500">View your quote requests</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </Link>

                {isAdmin && (
                    <Link
                        to="/admin/dashboard"
                        className="action-card card-animate stagger-2 flex items-center justify-between p-6 rounded-2xl group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="icon-container w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all">
                                <Settings className="w-7 h-7 text-zinc-700 group-hover:text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{t('admin')}</h3>
                                <p className="text-sm text-zinc-500">Manage products & enquiries</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </Link>
                )}
            </div>

            {/* Help & Support Section */}
            <div className="mb-6">
                <h2 className="section-title text-xl font-black uppercase tracking-tight">Help & Support</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-10">
                <a
                    href="mailto:support@arovave.com"
                    className="action-card card-animate stagger-1 flex items-center justify-between p-6 rounded-2xl group"
                >
                    <div className="flex items-center gap-4">
                        <div className="icon-container w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all">
                            <MessageSquare className="w-7 h-7 text-zinc-700 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Contact Us</h3>
                            <p className="text-sm text-zinc-500">Get help from our team</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </a>

                <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-card card-animate stagger-2 flex items-center justify-between p-6 rounded-2xl group"
                >
                    <div className="flex items-center gap-4">
                        <div className="icon-container w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all">
                            <HelpCircle className="w-7 h-7 text-zinc-700 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">WhatsApp Support</h3>
                            <p className="text-sm text-zinc-500">Chat with us on WhatsApp</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </a>

                <Link
                    to="/about"
                    className="action-card card-animate stagger-3 flex items-center justify-between p-6 rounded-2xl group"
                >
                    <div className="flex items-center gap-4">
                        <div className="icon-container w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all">
                            <FileText className="w-7 h-7 text-zinc-700 group-hover:text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">About Us</h3>
                            <p className="text-sm text-zinc-500">Learn more about Arovave Global</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </Link>

                <div className="action-card card-animate stagger-4 flex items-center justify-between p-6 rounded-2xl opacity-75">
                    <div className="flex items-center gap-4">
                        <div className="icon-container w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-7 h-7 text-zinc-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Privacy & Terms</h3>
                            <p className="text-sm text-zinc-500">Your data is secure with us</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-zinc-100 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Coming Soon
                    </div>
                </div>
            </div>

            {/* Security Settings Section */}
            <div className="mb-6">
                <h2 className="section-title text-xl font-black uppercase tracking-tight">Security Settings</h2>
            </div>
            <div className="mb-10">
                <button
                    onClick={() => setShowPasswordChange(true)}
                    className="action-card card-animate w-full flex items-center justify-between p-6 rounded-2xl group"
                >
                    <div className="flex items-center gap-4">
                        <div className="icon-container w-14 h-14 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-black transition-all">
                            <Lock className="w-7 h-7 text-zinc-700 group-hover:text-white" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg">Change Password</h3>
                            <p className="text-sm text-zinc-500">Update your account password</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </button>
            </div>

            {/* Change Password Modal */}
            {showPasswordChange && (
                <div className="modal-overlay fixed inset-0" onClick={closePasswordModal}>
                    <div className="glass-modal p-8 md:p-10 rounded-[32px] w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Change Password</h2>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {passwordChangeStep === 'request' && 'We will send a verification code to your email'}
                                    {passwordChangeStep === 'verify' && `Enter the 8-digit code sent to ${displayEmail}`}
                                    {passwordChangeStep === 'newpass' && 'Create your new password'}
                                </p>
                            </div>
                            <button
                                onClick={closePasswordModal}
                                className="p-3 hover:bg-zinc-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {passwordSuccess ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-black mx-auto mb-4" />
                                <p className="text-lg font-bold text-black">Password updated successfully!</p>
                            </div>
                        ) : (
                            <>
                                {/* Step 1: Request OTP */}
                                {passwordChangeStep === 'request' && (
                                    <div className="space-y-6">
                                        <div className="p-5 bg-zinc-50 rounded-xl">
                                            <p className="text-sm text-zinc-600">
                                                For your security, we need to verify your identity before changing your password.
                                            </p>
                                            <p className="text-sm font-bold mt-2">
                                                We'll send a verification code to: <span className="text-black">{displayEmail}</span>
                                            </p>
                                        </div>

                                        {passwordError && (
                                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <p className="font-bold">{passwordError}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <button
                                                onClick={handleRequestPasswordOtp}
                                                disabled={passwordChanging}
                                                className="btn-premium flex-1 flex items-center justify-center gap-2 py-4 text-white rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {passwordChanging ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Mail className="w-4 h-4" />
                                                )}
                                                {passwordChanging ? 'Sending...' : 'Send Verification Code'}
                                            </button>
                                            <button
                                                onClick={closePasswordModal}
                                                className="px-6 py-4 border-2 border-zinc-200 rounded-xl font-bold text-sm hover:border-black hover:bg-zinc-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Verify OTP */}
                                {passwordChangeStep === 'verify' && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-4">
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
                                                        className="w-10 h-12 text-center text-xl font-bold border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none transition-colors"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {passwordError && (
                                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <p className="font-bold">{passwordError}</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleVerifyPasswordOtp}
                                            disabled={passwordChanging || otpCode.join('').length !== 8}
                                            className="w-full btn-premium flex items-center justify-center gap-2 py-4 text-white rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {passwordChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
                                        </button>

                                        <p className="text-center text-sm text-zinc-500">
                                            Didn't receive the code?{' '}
                                            <button onClick={handleRequestPasswordOtp} disabled={passwordChanging} className="font-bold text-black hover:underline">
                                                Resend
                                            </button>
                                        </p>
                                    </div>
                                )}

                                {/* Step 3: New Password */}
                                {passwordChangeStep === 'newpass' && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm flex items-start gap-3 mb-2">
                                            <CheckCircle className="w-5 h-5 shrink-0" />
                                            <p className="font-semibold">Email verified! Now set your new password.</p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                                <Lock className="w-3 h-3 inline mr-1" /> New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    className="input-premium w-full px-5 py-4 rounded-xl font-semibold pr-12"
                                                    placeholder="Min 6 characters"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
                                                >
                                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                                <Lock className="w-3 h-3 inline mr-1" /> Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    className="input-premium w-full px-5 py-4 rounded-xl font-semibold pr-12"
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

                                        {passwordError && (
                                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                                <p className="font-bold">{passwordError}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-4 mt-8">
                                            <button
                                                onClick={handlePasswordChange}
                                                disabled={passwordChanging}
                                                className="btn-premium flex-1 flex items-center justify-center gap-2 py-4 text-white rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {passwordChanging ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Lock className="w-4 h-4" />
                                                )}
                                                {passwordChanging ? 'Updating...' : 'Update Password'}
                                            </button>
                                            <button
                                                onClick={closePasswordModal}
                                                className="px-6 py-4 border-2 border-zinc-200 rounded-xl font-bold text-sm hover:border-black hover:bg-zinc-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Premium Logout Button */}
            <button
                onClick={async () => {
                    await logout();
                    navigate('/');
                }}
                className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-zinc-100 text-zinc-700 font-bold group hover:bg-black hover:text-white transition-all"
            >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Sign Out
            </button>
        </div>
    );
}
