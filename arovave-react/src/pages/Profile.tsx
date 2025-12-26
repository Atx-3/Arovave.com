import { Link } from 'react-router-dom';
import { User as UserIcon, Settings, LogOut, Save, Edit2, X, Mail, Phone, MapPin, Calendar, HelpCircle, MessageSquare, FileText, Shield, ChevronRight } from 'lucide-react';
import { useAuth, useTranslation } from '../context';
import { useState, useEffect } from 'react';
import { AuthModal } from '../components/auth/AuthModal';
import { countries } from '../data';

export function Profile() {
    const { currentUser, supabaseUser, isAuthenticated, isAdmin, logout, updateProfile } = useAuth();
    const t = useTranslation();
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

    if (!isAuthenticated) {
        return (
            <>
                <div className="page-enter max-w-2xl mx-auto px-6 py-20 text-center">
                    <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <UserIcon className="w-12 h-12 text-zinc-400" />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Welcome to Arovave</h1>
                    <p className="text-zinc-500 mb-8">Sign in to manage your enquiries and get personalized quotes.</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            {t('signIn')}
                        </button>
                    </div>
                </div>
                {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            </>
        );
    }

    return (
        <div className="page-enter max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">{t('profile')}</h1>

            {/* Success Message */}
            {saveSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                    ✓ Profile updated successfully!
                </div>
            )}

            {/* Profile Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-3xl font-black text-black">{initials}</span>
                        </div>

                        {/* User Info */}
                        <div>
                            <h2 className="text-2xl font-black mb-1">{displayName}</h2>
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                                <Mail className="w-4 h-4" />
                                <span>{displayEmail}</span>
                            </div>
                            {displayPhone && (
                                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                                    <Phone className="w-4 h-4" />
                                    <span>{displayPhone}</span>
                                </div>
                            )}
                            {displayCountry && (
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    <span>{displayCountry}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Button */}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" /> Edit
                    </button>
                </div>

                {/* Member Since */}
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-zinc-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {displayJoined}</span>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="modal-overlay fixed inset-0" onClick={() => setIsEditing(false)}>
                    <div className="bg-white p-8 rounded-[32px] w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black uppercase tracking-tight">Edit Profile</h2>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
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
                                <p className="text-xs text-zinc-400 mt-1">Email cannot be changed</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Country</label>
                                <select
                                    value={editForm.country}
                                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none bg-white"
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
                                className="flex-1 flex items-center justify-center gap-2 py-4 bg-black text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:bg-zinc-400"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-4 border-2 border-zinc-200 rounded-xl font-bold text-sm hover:border-black transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <Link
                    to="/enquiries"
                    className="flex items-center justify-between p-5 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold">My Enquiries</h3>
                            <p className="text-sm text-zinc-400">View your quote requests</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                </Link>

                {isAdmin && (
                    <Link
                        to="/admin/dashboard"
                        className="flex items-center justify-between p-5 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                <Settings className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-bold">{t('admin')}</h3>
                                <p className="text-sm text-zinc-400">Manage products & enquiries</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                    </Link>
                )}
            </div>

            {/* Help & Support Section */}
            <h2 className="text-xl font-black uppercase tracking-tight mb-4">Help & Support</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <a
                    href="mailto:support@arovave.com"
                    className="flex items-center justify-between p-5 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold">Contact Us</h3>
                            <p className="text-sm text-zinc-400">Get help from our team</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                </a>

                <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-5 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold">WhatsApp Support</h3>
                            <p className="text-sm text-zinc-400">Chat with us on WhatsApp</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                </a>

                <Link
                    to="/about"
                    className="flex items-center justify-between p-5 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold">About Us</h3>
                            <p className="text-sm text-zinc-400">Learn more about Arovave</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-black transition-colors" />
                </Link>

                <div className="flex items-center justify-between p-5 bg-white border-2 border-zinc-100 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-zinc-600" />
                        </div>
                        <div>
                            <h3 className="font-bold">Privacy & Terms</h3>
                            <p className="text-sm text-zinc-400">Your data is secure with us</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 hover:bg-red-100 hover:border-red-200 transition-colors font-bold"
            >
                <LogOut className="w-5 h-5" />
                Sign Out
            </button>
        </div>
    );
}
