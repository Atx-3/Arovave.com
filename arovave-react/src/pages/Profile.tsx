import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings, LogOut, Save, Edit2, X, Mail, Phone, MapPin, Calendar, HelpCircle, MessageSquare, FileText, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth, useTranslation } from '../context';
import { useState, useEffect } from 'react';
import { AuthModal } from '../components/auth/AuthModal';
import { countries } from '../data';

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

    // No loading check needed - isLoading is always false now

    if (!isAuthenticated) {
        return (
            <>
                <div className="page-enter min-h-[80vh] flex items-center justify-center px-6 py-20 relative overflow-hidden">
                    {/* Background Gradient Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 max-w-md w-full">
                        {/* Premium Welcome Card */}
                        <div className="glass-modal p-10 rounded-[32px] text-center">
                            {/* Animated Avatar */}
                            <div className="relative mx-auto mb-8">
                                <div className="w-28 h-28 bg-gradient-to-br from-zinc-100 to-zinc-50 rounded-3xl flex items-center justify-center mx-auto shadow-lg float-animation">
                                    <UserIcon className="w-14 h-14 text-zinc-400" />
                                </div>
                                {/* Decorative rings */}
                                <div className="absolute inset-0 w-28 h-28 mx-auto rounded-3xl border-2 border-zinc-200/50 animate-pulse"></div>
                            </div>

                            {/* Typography */}
                            <h1 className="text-4xl font-black uppercase tracking-tighter mb-3">
                                Welcome
                            </h1>
                            <p className="text-lg text-zinc-600 font-medium mb-2">
                                to <span className="font-black text-black">Arovave</span>
                            </p>
                            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">
                                Sign in to manage your enquiries and get personalized quotes from verified manufacturers.
                            </p>

                            {/* Feature Pills */}
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full">
                                    Verified Suppliers
                                </span>
                                <span className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider rounded-full">
                                    Factory Direct
                                </span>
                                <span className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-wider rounded-full">
                                    Global Export
                                </span>
                            </div>

                            {/* Sign In Button */}
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="btn-premium w-full py-4 text-white font-bold text-sm uppercase tracking-widest rounded-xl"
                            >
                                {t('signIn')}
                            </button>

                            {/* Trust Badge */}
                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
                                <Shield className="w-4 h-4" />
                                <span>Secure authentication powered by Google</span>
                            </div>
                        </div>
                    </div>
                </div>
                {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            </>
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
                <div className="success-toast mb-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-bold text-emerald-800">Profile updated successfully!</p>
                        <p className="text-sm text-emerald-600">Your changes have been saved.</p>
                    </div>
                </div>
            )}

            {/* Premium Profile Card */}
            <div className="profile-card rounded-[32px] p-8 md:p-10 mb-10 text-white relative overflow-hidden">
                {/* Animated Orbs */}
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>

                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="flex items-center gap-6">
                        {/* Premium Avatar */}
                        <div className="avatar-premium w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center cursor-pointer">
                            <span className="text-3xl md:text-4xl font-black bg-gradient-to-br from-zinc-800 to-black bg-clip-text text-transparent">{initials}</span>
                        </div>

                        {/* User Info */}
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{displayName}</h2>
                            <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                    <Mail className="w-3 h-3" />
                                </div>
                                <span>{displayEmail}</span>
                            </div>
                            {displayPhone && (
                                <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                                        <Phone className="w-3 h-3" />
                                    </div>
                                    <span>{displayPhone}</span>
                                </div>
                            )}
                            {displayCountry && (
                                <div className="flex items-center gap-2 text-zinc-300 text-sm">
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
                        className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm font-bold hover:bg-white/20 hover:border-white/30 transition-all duration-300 group"
                    >
                        <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        Edit Profile
                    </button>
                </div>

                {/* Member Since Badge */}
                <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-zinc-300" />
                        <span className="text-zinc-200">Member since <span className="text-white font-semibold">{displayJoined}</span></span>
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
                        <div className="icon-container w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-7 h-7 text-blue-600" />
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
                            <div className="icon-container w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Settings className="w-7 h-7 text-purple-600" />
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
                        <div className="icon-container w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-7 h-7 text-green-600" />
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
                        <div className="icon-container w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <HelpCircle className="w-7 h-7 text-emerald-600" />
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
                        <div className="icon-container w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FileText className="w-7 h-7 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">About Us</h3>
                            <p className="text-sm text-zinc-500">Learn more about Arovave</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </Link>

                <div className="action-card card-animate stagger-4 flex items-center justify-between p-6 rounded-2xl opacity-75">
                    <div className="flex items-center gap-4">
                        <div className="icon-container w-14 h-14 bg-gradient-to-br from-zinc-100 to-zinc-50 rounded-xl flex items-center justify-center">
                            <Shield className="w-7 h-7 text-zinc-600" />
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

            {/* Premium Logout Button */}
            <button
                onClick={async () => {
                    await logout();
                    navigate('/');
                }}
                className="btn-logout w-full flex items-center justify-center gap-3 p-5 rounded-2xl text-red-600 font-bold group"
            >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Sign Out
            </button>
        </div>
    );
}
