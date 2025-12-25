import { Link } from 'react-router-dom';
import { User as UserIcon, Settings, LogOut, Trash2 } from 'lucide-react';
import { useAuth, useEnquiry, useTranslation } from '../context';
import { useState } from 'react';
import { AuthModal } from '../components/auth/AuthModal';

export function Profile() {
    const { currentUser, isAuthenticated, logout } = useAuth();
    const { cart, removeFromCart } = useEnquiry();
    const t = useTranslation();
    const [showAuthModal, setShowAuthModal] = useState(false);

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

            {/* User Info */}
            <div className="bg-zinc-50 rounded-3xl p-8 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl font-black">
                            {currentUser?.name?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">{currentUser?.name}</h2>
                        <p className="text-zinc-500">{currentUser?.email}</p>
                        <p className="text-zinc-400 text-sm">{currentUser?.country}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 gap-4 mb-12">
                <Link
                    to="/admin"
                    className="flex items-center gap-4 p-6 bg-white border-2 border-zinc-100 rounded-2xl hover:border-black transition-colors"
                >
                    <Settings className="w-6 h-6" />
                    <div>
                        <h3 className="font-bold">{t('admin')}</h3>
                        <p className="text-sm text-zinc-400">Manage products & enquiries</p>
                    </div>
                </Link>
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

            {/* My Enquiries Cart */}
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">{t('myEnquiries')}</h2>
                {cart.length === 0 ? (
                    <div className="bg-zinc-50 rounded-2xl p-12 text-center">
                        <p className="text-zinc-400 mb-4">No products in your enquiry list yet.</p>
                        <Link
                            to="/catalog"
                            className="text-xs font-bold uppercase tracking-widest underline decoration-2 underline-offset-8"
                        >
                            Browse Catalog
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cart.map(product => (
                            <div key={product.id} className="flex items-center gap-6 p-4 bg-white border-2 border-zinc-100 rounded-2xl">
                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-20 h-20 rounded-xl object-cover"
                                />
                                <div className="flex-1">
                                    <h3 className="font-bold">{product.name}</h3>
                                    <p className="text-sm text-zinc-400">{product.priceRange}</p>
                                </div>
                                <button
                                    onClick={() => removeFromCart(product.id)}
                                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
