import { Link } from 'react-router-dom';
import { MessageCircle, Package, CalendarDays, Filter } from 'lucide-react';
import { useTranslation, useEnquiry, useAuth } from '../context';
import { useEffect, useState, useMemo } from 'react';

export function Enquiries() {
    const t = useTranslation();
    const { allEnquiries } = useEnquiry();
    const { isAuthenticated, currentUser } = useAuth();

    // Get user join date to set filter start
    const userJoinDate = useMemo(() => {
        if (currentUser?.joined) {
            return new Date(currentUser.joined);
        }
        return new Date();
    }, [currentUser]);

    // Date filter state - start from user join date
    const currentDate = new Date();
    const [filterYear, setFilterYear] = useState<number>(currentDate.getFullYear());
    const [filterMonth, setFilterMonth] = useState<number>(currentDate.getMonth() + 1);
    const [showFilters, setShowFilters] = useState(false);

    // Generate year options (from join year to current year)
    const yearOptions = useMemo(() => {
        const startYear = userJoinDate.getFullYear();
        const endYear = currentDate.getFullYear();
        const years = [];
        for (let y = endYear; y >= startYear; y--) {
            years.push(y);
        }
        return years;
    }, [userJoinDate]);

    // Month names
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get valid months for selected year
    const validMonths = useMemo(() => {
        const startMonth = filterYear === userJoinDate.getFullYear() ? userJoinDate.getMonth() + 1 : 1;
        const endMonth = filterYear === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 12;
        return monthNames.slice(startMonth - 1, endMonth).map((name, idx) => ({
            value: startMonth + idx,
            name
        }));
    }, [filterYear, userJoinDate]);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Filter enquiries for current user
    const userEnquiries = allEnquiries.filter(e =>
        currentUser && e.user.email === currentUser.email
    );

    // Filter by selected month and year
    const filteredEnquiries = userEnquiries.filter(e => {
        const enquiryDate = new Date(e.date);
        return enquiryDate.getFullYear() === filterYear &&
            enquiryDate.getMonth() + 1 === filterMonth;
    });

    // Sort by date descending (newest first)
    const sortedEnquiries = [...filteredEnquiries].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-50 text-yellow-700',
        contacted: 'bg-blue-50 text-blue-700',
        completed: 'bg-green-50 text-green-700',
        'completed-win': 'bg-green-50 text-green-700',
        'completed-loss': 'bg-red-50 text-red-700',
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">{t('myEnquiries')}</h1>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${showFilters ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                >
                    <Filter className="w-4 h-4" />
                    Filter
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-zinc-50 rounded-2xl p-4 mb-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-wrap gap-3 items-center">
                        <CalendarDays className="w-4 h-4 text-zinc-400" />
                        <select
                            value={filterMonth}
                            onChange={e => setFilterMonth(Number(e.target.value))}
                            className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-black cursor-pointer"
                        >
                            {validMonths.map(month => (
                                <option key={month.value} value={month.value}>{month.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterYear}
                            onChange={e => {
                                const newYear = Number(e.target.value);
                                setFilterYear(newYear);
                                // Reset month if current month is not valid for new year
                                const startMonth = newYear === userJoinDate.getFullYear() ? userJoinDate.getMonth() + 1 : 1;
                                const endMonth = newYear === currentDate.getFullYear() ? currentDate.getMonth() + 1 : 12;
                                if (filterMonth < startMonth || filterMonth > endMonth) {
                                    setFilterMonth(endMonth);
                                }
                            }}
                            className="bg-white border border-zinc-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-black cursor-pointer"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <span className="text-sm text-zinc-500 ml-2">
                            {sortedEnquiries.length} result{sortedEnquiries.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            )}

            {sortedEnquiries.length === 0 ? (
                <div className="bg-zinc-50 rounded-3xl p-16 text-center">
                    <p className="text-zinc-400 text-lg mb-6">
                        {showFilters
                            ? `No enquiries found for ${monthNames[filterMonth - 1]} ${filterYear}.`
                            : "You haven't submitted any enquiries yet."}
                    </p>
                    <Link
                        to="/catalog"
                        className="inline-block px-8 py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        Browse Catalog
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedEnquiries.map((enquiry, index) => (
                        <div key={enquiry.id} className="bg-white border-2 border-zinc-100 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-zinc-400 font-bold">#{sortedEnquiries.length - index}</span>
                                    <span className="text-sm text-zinc-400">{enquiry.date}</span>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${statusColors[enquiry.status] || statusColors.pending}`}>
                                    {enquiry.status.replace('-', ' ')}
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
