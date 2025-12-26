import { Link } from 'react-router-dom';
import { User as UserIcon, Settings, LogOut, Save, Edit2 } from 'lucide-react';
import { useAuth, useTranslation } from '../context';
import { useState, useEffect } from 'react';
import { AuthModal } from '../components/auth/AuthModal';

export function Profile() {
    const { currentUser, isAuthenticated, isAdmin, logout, updateProfile } = useAuth();
    const t = useTranslation();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        country: ''
    });

    // Load user data into form
    useEffect(() => {
        if (currentUser) {
            setEditForm({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                country: currentUser.country || ''
            });
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (updateProfile) {
            await updateProfile(editForm);
        }
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
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-12">{t('profile')}</h1>

            {/* User Info / Edit Form */}
            <div className="bg-zinc-50 rounded-3xl p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white text-2xl font-black">
                                {currentUser?.name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        {!isEditing && (
                            <div>
                                <h2 className="text-2xl font-black">{currentUser?.name}</h2>
                                <p className="text-zinc-500">{currentUser?.email}</p>
                                <p className="text-zinc-400 text-sm">{currentUser?.phone || 'No phone added'}</p>
                                <p className="text-zinc-400 text-sm">{currentUser?.country}</p>
                            </div>
                        )}
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-zinc-200 rounded-xl text-sm font-bold hover:border-black transition-colors"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>
                    )}
                </div>

                {isEditing && (
                    <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Country</label>
                                <input
                                    type="text"
                                    value={editForm.country}
                                    onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3 border-2 border-zinc-200 rounded-xl text-sm font-bold hover:border-black transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 gap-4">
                {isAdmin && (
                    <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-4 p-6 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors"
                    >
                        <Settings className="w-6 h-6" />
                        <div>
                            <h3 className="font-bold">{t('admin')}</h3>
                            <p className="text-sm text-zinc-400">Manage products & enquiries</p>
                        </div>
                    </Link>
                )}
                <button
                    onClick={logout}
                    className="flex items-center gap-4 p-6 bg-white border-2 border-red-100 rounded-2xl text-red-500 hover:border-red-300 transition-colors text-left"
                >
                    <LogOut className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">{t('logout')}</h3>
                        <p className="text-sm text-red-300">Sign out of your account</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
