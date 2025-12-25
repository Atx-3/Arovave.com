import { Link } from 'react-router-dom';
import { MessageCircle, Package } from 'lucide-react';
import { useTranslation, useEnquiry, useAuth } from '../context';
import { useEffect } from 'react';

export function Enquiries() {
    const t = useTranslation();
    const { allEnquiries } = useEnquiry();
    const { isAuthenticated, currentUser } = useAuth();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Filter enquiries for current user
    const userEnquiries = allEnquiries.filter(e =>
        currentUser && e.user.email === currentUser.email
    );

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-50 text-yellow-700',
        contacted: 'bg-blue-50 text-blue-700',
        completed: 'bg-green-50 text-green-700',
        cancelled: 'bg-red-50 text-red-700'
    };

    if (!isAuthenticated) {
        return (
            <div className="page-enter max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">{t('myEnquiries')}</h1>
                <div className="bg-zinc-50 rounded-3xl p-16 text-center">
                    <p className="text-zinc-400 text-lg mb-6">Please sign in to view your enquiries.</p>
                    <Link
                        to="/profile"
                        className="inline-block px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-enter max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">{t('myEnquiries')}</h1>

            {userEnquiries.length === 0 ? (
                <div className="bg-zinc-50 rounded-3xl p-16 text-center">
                    <p className="text-zinc-400 text-lg mb-6">You haven't submitted any enquiries yet.</p>
                    <Link
                        to="/catalog"
                        className="inline-block px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        Browse Catalog
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {userEnquiries.map(enquiry => (
                        <div key={enquiry.id} className="bg-white border-2 border-zinc-100 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-zinc-400 font-bold">#{enquiry.id}</span>
                                    <span className="text-sm text-zinc-400">{enquiry.date}</span>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${statusColors[enquiry.status]}`}>
                                    {enquiry.status}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {enquiry.products.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                                        {p.id === 0 ? (
                                            <MessageCircle className="w-5 h-5 text-blue-500" />
                                        ) : (
                                            <Package className="w-5 h-5 text-zinc-400" />
                                        )}
                                        <div>
                                            <p className="font-bold">{p.name}</p>
                                            {p.qty && <p className="text-xs text-zinc-400">{p.qty}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
