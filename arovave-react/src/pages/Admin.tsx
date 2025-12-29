import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Inbox, ArrowLeft, Mail, Plus, Edit, Trash2, ImagePlus, Video, X, Award, Utensils, Pill, FlaskConical, Gift, Shield, UserCog, Check, Loader2, FolderOpen, MessageCircle, Send, Clock } from 'lucide-react';
import { useEnquiry, useAuth } from '../context';
import { supabase } from '../lib/supabase';
import { products as initialProducts, categories } from '../data';
import type { Product, Enquiry } from '../types';
import type { AdminPermission } from '../context/AuthContext';

// Get products from localStorage or use initial
const getStoredProducts = (): Product[] => {
    const saved = localStorage.getItem('arovaveProducts');
    if (saved) {
        return JSON.parse(saved);
    }
    return [...initialProducts];
};

// Category type
type Category = {
    id: string;
    name: string;
    icon: string;
    subcategories: { id: string; name: string }[];
};

// Get categories from localStorage or use initial
const getStoredCategories = (): Category[] => {
    const saved = localStorage.getItem('arovaveCategories');
    if (saved) {
        return JSON.parse(saved);
    }
    return categories as Category[];
};

export function Admin() {
    const { hasPermission, isSuperAdmin, currentUser } = useAuth();
    const [tab, setTab] = useState<'users' | 'products' | 'enquiries' | 'quality' | 'settings' | 'admins' | 'categories' | 'support'>('enquiries');
    const { allEnquiries, updateEnquiryStatus, isLoadingEnquiries } = useEnquiry();
    const [products, setProducts] = useState<Product[]>(getStoredProducts);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Category management state
    const [managedCategories, setManagedCategories] = useState<Category[]>(getStoredCategories);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');
    const [selectedCategoryForSubcat, setSelectedCategoryForSubcat] = useState<string>('food');

    // Admin management state (for superadmins)
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [savingPermissions, setSavingPermissions] = useState<string | null>(null);

    // Quality content state
    const [qualityContent, setQualityContent] = useState<Record<string, any[]>>({});
    const [selectedQualityCategory, setSelectedQualityCategory] = useState<string>('food');
    const [qualitySubcategory, setQualitySubcategory] = useState<string>('');
    const [qualityContentType, setQualityContentType] = useState<string>('certificate');

    // Video URL state
    const [videoUrl, setVideoUrl] = useState('https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4');
    const [isSavingVideo, setIsSavingVideo] = useState(false);

    // Support ticket state
    type SupportTicket = {
        id: string;
        user_email: string;
        user_name: string;
        problem_type: string;
        subject: string;
        status: string;
        created_at: string;
        updated_at: string;
    };
    type SupportMessage = {
        id: string;
        ticket_id: string;
        sender_type: 'user' | 'admin';
        sender_name: string;
        message: string;
        created_at: string;
    };
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [selectedSupportTicket, setSelectedSupportTicket] = useState<SupportTicket | null>(null);
    const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
    const [supportReply, setSupportReply] = useState('');
    const [loadingSupport, setLoadingSupport] = useState(false);
    const [supportStatusFilter, setSupportStatusFilter] = useState<string>('all');

    // Fetch video URL from Supabase
    const fetchVideoUrl = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('video_url')
                .eq('id', 'global')
                .single();

            if (!error && data?.video_url) {
                setVideoUrl(data.video_url);
            }
        } catch (err) {
            console.error('Error fetching video URL:', err);
        }
    };

    // Save video URL to Supabase
    const saveVideoUrl = async (url: string) => {
        if (!url || url.startsWith('data:')) return;

        setIsSavingVideo(true);
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    id: 'global',
                    video_url: url,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                console.error('Error saving video URL:', error);
                alert('Failed to save video URL. You may not have admin permissions.');
            } else {
                alert('Video URL saved! All users will see this video on the homepage.');
            }
        } catch (err) {
            console.error('Error saving video URL:', err);
            alert('Failed to save video URL.');
        } finally {
            setIsSavingVideo(false);
        }
    };

    // Available admin permissions
    const availablePermissions: { key: AdminPermission; label: string; icon: any }[] = [
        { key: 'enquiries', label: 'Enquiries', icon: Inbox },
        { key: 'products', label: 'Products', icon: Package },
        { key: 'users', label: 'View Users', icon: Users },
        { key: 'settings', label: 'Settings', icon: Award }
    ];

    // Fetch all users (for superadmin)
    const fetchAllUsers = async () => {
        if (!isSuperAdmin) return;

        setIsLoadingUsers(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Update user role and permissions
    const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'superadmin', permissions: AdminPermission[]) => {
        setSavingPermissions(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole, permissions: permissions })
                .eq('id', userId);

            if (error) throw error;
            await fetchAllUsers();
        } catch (err) {
            console.error('Error updating user role:', err);
            alert('Failed to update user role');
        } finally {
            setSavingPermissions(null);
        }
    };

    // Toggle permission for a user
    const togglePermission = async (userId: string, permission: AdminPermission, currentPermissions: AdminPermission[]) => {
        const newPermissions = currentPermissions.includes(permission)
            ? currentPermissions.filter(p => p !== permission)
            : [...currentPermissions, permission];
        await updateUserRole(userId, 'admin', newPermissions);
    };

    // Support ticket functions
    const loadSupportTickets = async () => {
        setLoadingSupport(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('updated_at', { ascending: false });

            if (!error && data) {
                setSupportTickets(data);
            }
        } catch (err) {
            console.error('Error loading support tickets:', err);
        } finally {
            setLoadingSupport(false);
        }
    };

    const loadSupportMessages = async (ticketId: string) => {
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setSupportMessages(data);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    };

    const sendSupportReply = async () => {
        if (!supportReply.trim() || !selectedSupportTicket) return;

        try {
            await supabase.from('support_messages').insert({
                ticket_id: selectedSupportTicket.id,
                sender_type: 'admin',
                sender_name: currentUser?.name || 'Admin',
                message: supportReply
            });

            await supabase
                .from('support_tickets')
                .update({ updated_at: new Date().toISOString(), status: 'in_progress' })
                .eq('id', selectedSupportTicket.id);

            setSupportReply('');
            await loadSupportMessages(selectedSupportTicket.id);
            await loadSupportTickets();
        } catch (err) {
            console.error('Error sending reply:', err);
        }
    };

    const updateTicketStatus = async (ticketId: string, status: string) => {
        try {
            await supabase
                .from('support_tickets')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', ticketId);

            await loadSupportTickets();
            if (selectedSupportTicket?.id === ticketId) {
                setSelectedSupportTicket(prev => prev ? { ...prev, status } : null);
            }
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const problemTypeLabels: Record<string, string> = {
        account: 'Account Issues',
        order: 'Order & Shipping',
        product: 'Product Questions',
        technical: 'Technical Problems',
        other: 'Other'
    };

    const supportStatusConfig: Record<string, { color: string; label: string }> = {
        open: { color: 'bg-yellow-100 text-yellow-700', label: 'Open' },
        in_progress: { color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
        resolved: { color: 'bg-green-100 text-green-700', label: 'Resolved' },
        closed: { color: 'bg-zinc-100 text-zinc-600', label: 'Closed' }
    };

    // Fetch categories from Supabase
    const fetchCategoriesFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('id');

            if (!error && data && data.length > 0) {
                const formattedCategories = data.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name,
                    icon: cat.icon,
                    subcategories: cat.subcategories || []
                }));
                setManagedCategories(formattedCategories);
                // Also save to localStorage for faster loading
                localStorage.setItem('arovaveCategories', JSON.stringify(formattedCategories));
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    // Save category to Supabase
    const saveCategoryToSupabase = async (categoryId: string, subcategories: { id: string; name: string }[]) => {
        try {
            await supabase
                .from('categories')
                .update({
                    subcategories: subcategories,
                    updated_at: new Date().toISOString()
                })
                .eq('id', categoryId);
        } catch (err) {
            console.error('Error saving category:', err);
        }
    };

    // Fetch quality uploads from Supabase
    const fetchQualityUploadsFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('quality_uploads')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                // Group by key (category_subcategory_contentType)
                const grouped: Record<string, any[]> = {};
                data.forEach((item: any) => {
                    const key = `${item.category_id}_${item.subcategory_id}_${item.content_type}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push({
                        id: item.id,
                        title: item.title,
                        image: item.image_url,
                        description: item.description
                    });
                });
                setQualityContent(grouped);
                // Also cache to localStorage
                localStorage.setItem('arovaveQualityUploads', JSON.stringify(grouped));
            }
        } catch (err) {
            console.error('Error fetching quality uploads:', err);
        }
    };

    // Save quality upload to Supabase
    const saveQualityUploadToSupabase = async (
        categoryId: string,
        subcategoryId: string,
        contentType: string,
        title: string,
        imageUrl: string,
        description?: string
    ) => {
        try {
            const { data, error } = await supabase
                .from('quality_uploads')
                .insert({
                    category_id: categoryId,
                    subcategory_id: subcategoryId,
                    content_type: contentType,
                    title: title,
                    image_url: imageUrl,
                    description: description || null
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error saving quality upload:', err);
            return null;
        }
    };

    // Delete quality upload from Supabase
    const deleteQualityUploadFromSupabase = async (id: string) => {
        try {
            await supabase
                .from('quality_uploads')
                .delete()
                .eq('id', id);
        } catch (err) {
            console.error('Error deleting quality upload:', err);
        }
    };

    // Scroll to top when tab changes
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [tab]);

    // Scroll to top on mount and load data
    useEffect(() => {
        window.scrollTo(0, 0);

        // Load quality uploads from Supabase
        fetchQualityUploadsFromSupabase();

        // Load video URL from Supabase
        fetchVideoUrl();

        // Load categories from Supabase
        fetchCategoriesFromSupabase();

        // Load users for superadmin
        if (isSuperAdmin) {
            fetchAllUsers();
        }
    }, [isSuperAdmin]);

    // Set initial tab based on permissions
    useEffect(() => {
        if (isSuperAdmin) {
            setTab('enquiries');
        } else if (hasPermission('enquiries')) {
            setTab('enquiries');
        } else if (hasPermission('products')) {
            setTab('products');
        } else if (hasPermission('users')) {
            setTab('users');
        } else if (hasPermission('settings')) {
            setTab('settings');
        }
    }, [isSuperAdmin, currentUser]);


    // Quality categories now use managedCategories from Supabase
    // This allows dynamic add/delete of categories

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-50 text-yellow-700',
        contacted: 'bg-blue-50 text-blue-700',
        'completed-win': 'bg-green-50 text-green-700',
        'completed-loss': 'bg-orange-50 text-orange-700',
        cancelled: 'bg-red-50 text-red-700'
    };

    const deleteProduct = (id: number) => {
        if (confirm('Delete this product?')) {
            const updated = products.filter(p => p.id !== id);
            setProducts(updated);
            localStorage.setItem('arovaveProducts', JSON.stringify(updated));
        }
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setShowProductModal(true);
    };

    const closeModal = () => {
        setShowProductModal(false);
        setEditingProduct(null);
    };

    const addQualityItem = (category: string, type: string) => {
        const title = prompt('Enter title for this item:');
        const imageUrl = prompt('Enter image URL:');
        if (!title || !imageUrl) return;

        const newItem = {
            id: Date.now(),
            type,
            title,
            image: imageUrl
        };

        const updated = {
            ...qualityContent,
            [category]: [...(qualityContent[category] || []), newItem]
        };
        setQualityContent(updated);
        localStorage.setItem('arovaveQualityContent', JSON.stringify(updated));
    };

    const deleteQualityItem = (category: string, itemId: number) => {
        if (!confirm('Delete this item?')) return;
        const updated = {
            ...qualityContent,
            [category]: qualityContent[category].filter((item: any) => item.id !== itemId)
        };
        setQualityContent(updated);
        localStorage.setItem('arovaveQualityContent', JSON.stringify(updated));
    };

    return (
        <div className="page-enter max-w-7xl mx-auto px-6 py-12">
            <Link to="/profile" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-8 inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>

            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Admin Panel</h1>
            <p className="text-zinc-500 mb-8">Manage users, products, enquiries, and quality content</p>

            {/* Tabs - Only show tabs user has permission for */}
            <div className="flex gap-4 mb-8 border-b border-zinc-100 flex-wrap">
                {(isSuperAdmin || hasPermission('enquiries')) && (
                    <button
                        onClick={() => setTab('enquiries')}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'enquiries' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        <Inbox className="w-4 h-4" /> Enquiries
                    </button>
                )}
                {(isSuperAdmin || hasPermission('products')) && (
                    <button
                        onClick={() => setTab('products')}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'products' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        <Package className="w-4 h-4" /> Products
                    </button>
                )}
                {(isSuperAdmin || hasPermission('users')) && (
                    <button
                        onClick={() => setTab('users')}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'users' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        <Users className="w-4 h-4" /> Users
                    </button>
                )}
                {isSuperAdmin && (
                    <button
                        onClick={() => setTab('quality')}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'quality' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        <Award className="w-4 h-4" /> Quality Content
                    </button>
                )}
                {(isSuperAdmin || hasPermission('settings')) && (
                    <button
                        onClick={() => setTab('settings')}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'settings' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        ⚙️ Settings
                    </button>
                )}
                {isSuperAdmin && (
                    <button
                        onClick={() => setTab('categories')}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'categories' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        <FolderOpen className="w-4 h-4" /> Categories
                    </button>
                )}
                {isSuperAdmin && (
                    <button
                        onClick={() => setTab('admins')}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'admins' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        <Shield className="w-4 h-4" /> Manage Admins
                    </button>
                )}
                {(isSuperAdmin || hasPermission('enquiries')) && (
                    <button
                        onClick={() => { setTab('support'); loadSupportTickets(); }}
                        className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'support' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                    >
                        <MessageCircle className="w-4 h-4" /> Support
                    </button>
                )}
            </div>

            {/* Manage Admins Tab (Super Admin Only) */}
            {tab === 'admins' && isSuperAdmin && (
                <div className="space-y-6">
                    {/* Add New Admin Form */}
                    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100">
                            <h3 className="font-black uppercase tracking-widest text-sm">Add New Admin</h3>
                            <p className="text-zinc-500 text-sm mt-2">Enter a registered user's email to promote them to admin or super admin.</p>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                        <Mail className="w-3 h-3 inline mr-1" /> User Email
                                    </label>
                                    <input
                                        type="email"
                                        id="newAdminEmail"
                                        placeholder="user@example.com"
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                    />
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                        Role
                                    </label>
                                    <select
                                        id="newAdminRole"
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none bg-white"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Super Admin</option>
                                    </select>
                                </div>
                                <button
                                    onClick={async () => {
                                        const emailInput = document.getElementById('newAdminEmail') as HTMLInputElement;
                                        const roleSelect = document.getElementById('newAdminRole') as HTMLSelectElement;
                                        const email = emailInput?.value.trim();
                                        const role = roleSelect?.value as 'admin' | 'superadmin';

                                        if (!email) {
                                            alert('Please enter an email address');
                                            return;
                                        }

                                        // Find user by email
                                        const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
                                        if (!user) {
                                            alert('User not found! Make sure they have registered first.');
                                            return;
                                        }

                                        if (user.role === 'superadmin' || user.role === 'admin') {
                                            alert('This user is already an admin!');
                                            return;
                                        }

                                        const permissions = role === 'superadmin'
                                            ? ['enquiries', 'products', 'users', 'settings']
                                            : ['enquiries'];

                                        await updateUserRole(user.id, role, permissions as AdminPermission[]);
                                        emailInput.value = '';
                                        alert(`${user.name || email} is now a ${role === 'superadmin' ? 'Super Admin' : 'Admin'}!`);
                                    }}
                                    className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                >
                                    <UserCog className="w-4 h-4 inline mr-2" />
                                    Add Admin
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Current Admins List */}
                    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100">
                            <h3 className="font-black uppercase tracking-widest text-sm">
                                Current Admins ({allUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').length})
                            </h3>
                        </div>
                        {isLoadingUsers ? (
                            <div className="p-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {allUsers
                                    .filter(u => (u.role === 'admin' || u.role === 'superadmin') && u.id !== currentUser?.id)
                                    .map(user => (
                                        <div key={user.id} className="p-6">
                                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <p className="font-bold text-lg">{user.name || 'No name'}</p>
                                                    <p className="text-zinc-500 text-sm">{user.email}</p>
                                                    <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {/* Role Dropdown */}
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Role:</label>
                                                        <select
                                                            value={user.role || 'admin'}
                                                            onChange={(e) => {
                                                                const newRole = e.target.value as 'admin' | 'superadmin';
                                                                const newPermissions = newRole === 'superadmin'
                                                                    ? ['enquiries', 'products', 'users', 'settings']
                                                                    : user.permissions || ['enquiries'];
                                                                updateUserRole(user.id, newRole, newPermissions as AdminPermission[]);
                                                            }}
                                                            disabled={savingPermissions === user.id}
                                                            className="px-4 py-2 border-2 border-zinc-200 rounded-lg text-sm font-bold focus:border-black focus:outline-none bg-white disabled:opacity-50"
                                                        >
                                                            <option value="admin">Admin</option>
                                                            <option value="superadmin">Super Admin</option>
                                                        </select>
                                                    </div>
                                                    {/* Remove Admin Button */}
                                                    <button
                                                        onClick={() => updateUserRole(user.id, 'user', [])}
                                                        disabled={savingPermissions === user.id}
                                                        className="px-4 py-2 bg-red-100 text-red-600 text-xs font-bold uppercase rounded-lg hover:bg-red-200 disabled:opacity-50"
                                                    >
                                                        {savingPermissions === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Permissions checkboxes for admins */}
                                            {user.role === 'admin' && (
                                                <div className="bg-zinc-50 rounded-xl p-4">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Admin Tab Access:</p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {availablePermissions.map(perm => {
                                                            const userPerms: AdminPermission[] = user.permissions || [];
                                                            const hasThisPerm = userPerms.includes(perm.key);
                                                            return (
                                                                <button
                                                                    key={perm.key}
                                                                    onClick={() => togglePermission(user.id, perm.key, userPerms)}
                                                                    disabled={savingPermissions === user.id}
                                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${hasThisPerm
                                                                        ? 'bg-green-600 text-white'
                                                                        : 'bg-white border-2 border-zinc-200 text-zinc-500 hover:border-black'
                                                                        }`}
                                                                >
                                                                    {hasThisPerm && <Check className="w-3 h-3" />}
                                                                    <perm.icon className="w-3 h-3" />
                                                                    {perm.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                {allUsers.filter(u => (u.role === 'admin' || u.role === 'superadmin') && u.id !== currentUser?.id).length === 0 && (
                                    <div className="p-12 text-center text-zinc-400">
                                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>No other admins yet. Add one using the form above!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (isSuperAdmin || hasPermission('users')) && (
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                    <div className="p-6 border-b border-zinc-100">
                        <h3 className="font-black uppercase tracking-widest text-sm">All Registered Users ({allUsers.length})</h3>
                    </div>
                    {isLoadingUsers ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-50">
                                    <tr>
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Name</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Email</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Country</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Role</th>
                                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map((user) => (
                                        <tr key={user.id} className="border-t border-zinc-50">
                                            <td className="p-4 font-semibold">{user.name || '-'}</td>
                                            <td className="p-4 text-zinc-600">{user.email}</td>
                                            <td className="p-4 text-zinc-600">{user.country || '-'}</td>
                                            <td className="p-4 text-zinc-600">{user.phone || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-zinc-100 text-zinc-600'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-zinc-400 text-sm">{user.created_at?.split('T')[0] || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Products Tab */}
            {tab === 'products' && (isSuperAdmin || hasPermission('products')) && (
                <div>
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={() => setShowProductModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Product
                        </button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(p => (
                            <div key={p.id} className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                                <div className="aspect-video overflow-hidden">
                                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{p.cat}</span>
                                    <h4 className="font-bold text-lg">{p.name}</h4>
                                    <p className="text-sm text-black font-bold mb-1">{p.priceRange}</p>
                                    <p className="text-xs text-zinc-400 mb-4">MOQ: {p.moq} | HSN: {p.hsn}</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(p)}
                                            className="flex-1 py-2 border-2 border-zinc-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-black transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3 h-3" /> Edit
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(p.id)}
                                            className="px-4 py-2 border-2 border-red-200 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Enquiries Tab */}
            {tab === 'enquiries' && (isSuperAdmin || hasPermission('enquiries')) && (
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center flex-wrap gap-4">
                        <h3 className="font-black uppercase tracking-widest text-sm">All Enquiries ({allEnquiries.length})</h3>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[9px] font-bold rounded-full">
                                Pending: {allEnquiries.filter(e => e.status === 'pending').length}
                            </span>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-full">
                                Contacted: {allEnquiries.filter(e => e.status === 'contacted').length}
                            </span>
                            <span className="px-3 py-1 bg-green-50 text-green-700 text-[9px] font-bold rounded-full">
                                Completed: {allEnquiries.filter(e => e.status === 'completed').length}
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">ID</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Products</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allEnquiries.map(enq => (
                                    <tr key={enq.id} className="border-t border-zinc-50 hover:bg-zinc-50">
                                        <td className="p-4 font-bold text-zinc-400">#{enq.id}</td>
                                        <td className="p-4">
                                            <p className="font-bold">{enq.user.name}</p>
                                            <p className="text-xs text-zinc-400">{enq.user.email}</p>
                                            <p className="text-xs text-zinc-500">{enq.user.phone || 'No phone'}</p>
                                        </td>
                                        <td className="p-4">
                                            {enq.products.map(p => (
                                                <div key={p.id} className="text-sm">{p.name}</div>
                                            ))}
                                        </td>
                                        <td className="p-4 text-zinc-600 text-sm">{enq.date}</td>
                                        <td className="p-4">
                                            <select
                                                value={enq.status}
                                                onChange={e => updateEnquiryStatus(enq.id, e.target.value as Enquiry['status'])}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border-0 cursor-pointer ${statusColors[enq.status]}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="completed-win">Complete - WIN</option>
                                                <option value="completed-loss">Complete - LOSS</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            <a
                                                href={`mailto:${enq.user.email}`}
                                                className="flex items-center gap-1 px-3 py-1.5 border-2 border-zinc-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-black transition-colors"
                                            >
                                                <Mail className="w-3 h-3" /> Email
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quality Content Tab */}
            {tab === 'quality' && (
                <div>
                    <p className="text-zinc-500 mb-6">Upload certificates, plant photos, and product samples for each category and subcategory.</p>

                    {/* Category Selection */}
                    <div className="mb-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Select Category</label>
                        <div className="flex gap-3 flex-wrap">
                            {managedCategories.map(cat => {
                                const categoryIcons: Record<string, any> = { food: Utensils, pharma: Pill, glass: FlaskConical, promo: Gift };
                                const CatIcon = categoryIcons[cat.id] || Gift;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedQualityCategory(cat.id)}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${selectedQualityCategory === cat.id
                                            ? 'bg-black text-white'
                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                            }`}
                                    >
                                        <CatIcon className="w-4 h-4" />
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Subcategory Selection */}
                    {selectedQualityCategory && (
                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Select Subcategory</label>
                            <select
                                value={qualitySubcategory}
                                onChange={(e) => setQualitySubcategory(e.target.value)}
                                className="px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                            >
                                <option value="">-- Select Subcategory --</option>
                                <option value="all">All {managedCategories.find(c => c.id === selectedQualityCategory)?.name}</option>
                                {managedCategories.find(c => c.id === selectedQualityCategory)?.subcategories?.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Content Type Selection */}
                    {qualitySubcategory && (
                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Content Type</label>
                            <div className="flex gap-3">
                                {['certificate', 'plant', 'sample'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setQualityContentType(type)}
                                        className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest ${qualityContentType === type
                                            ? type === 'certificate' ? 'bg-green-600 text-white' : type === 'plant' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                            }`}
                                    >
                                        {type === 'certificate' ? 'Certificates' : type === 'plant' ? 'Plant Photos' : 'Product Samples'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add New Item */}
                    {qualitySubcategory && qualityContentType && (
                        <div className="bg-zinc-50 rounded-2xl p-6 mb-8">
                            <h3 className="font-bold mb-4">Add New {qualityContentType === 'certificate' ? 'Certificate' : qualityContentType === 'plant' ? 'Plant Photo' : 'Product Sample'}</h3>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    placeholder="Title"
                                    id="qualityItemTitle"
                                    className="px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="qualityItemImage"
                                    className="px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-black file:text-white"
                                />
                            </div>
                            <textarea
                                placeholder="Description (optional - write about this image)"
                                id="qualityItemDesc"
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none resize-none mb-4"
                            />
                            <p className="text-xs text-zinc-400 mb-4">Max 5MB image file. Supports JPG, PNG, WebP.</p>
                            <button
                                onClick={async () => {
                                    const title = (document.getElementById('qualityItemTitle') as HTMLInputElement)?.value;
                                    const fileInput = document.getElementById('qualityItemImage') as HTMLInputElement;
                                    const description = (document.getElementById('qualityItemDesc') as HTMLTextAreaElement)?.value;
                                    const file = fileInput?.files?.[0];

                                    if (!title) return alert('Please enter a title');
                                    if (!file) return alert('Please select an image file');
                                    if (file.size > 5 * 1024 * 1024) return alert('Image too large! Max 5MB.');

                                    try {
                                        // Upload image to Supabase Storage
                                        const fileName = `quality/${selectedQualityCategory}/${qualitySubcategory}/${qualityContentType}/${Date.now()}_${file.name}`;
                                        const { data: uploadData, error: uploadError } = await supabase.storage
                                            .from('quality-images')
                                            .upload(fileName, file, { cacheControl: '3600', upsert: false });

                                        if (uploadError) {
                                            // If bucket doesn't exist, use base64 as fallback
                                            console.warn('Storage upload failed, using base64 fallback:', uploadError);
                                            const reader = new FileReader();
                                            reader.onload = async () => {
                                                const imageUrl = reader.result as string;
                                                const saved = await saveQualityUploadToSupabase(
                                                    selectedQualityCategory,
                                                    qualitySubcategory,
                                                    qualityContentType,
                                                    title,
                                                    imageUrl,
                                                    description
                                                );
                                                if (saved) {
                                                    await fetchQualityUploadsFromSupabase();
                                                    (document.getElementById('qualityItemTitle') as HTMLInputElement).value = '';
                                                    (document.getElementById('qualityItemDesc') as HTMLTextAreaElement).value = '';
                                                    fileInput.value = '';
                                                    alert('✅ Item added!');
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                            return;
                                        }

                                        // Get public URL
                                        const { data: urlData } = supabase.storage.from('quality-images').getPublicUrl(fileName);
                                        const imageUrl = urlData.publicUrl;

                                        // Save to database
                                        const saved = await saveQualityUploadToSupabase(
                                            selectedQualityCategory,
                                            qualitySubcategory,
                                            qualityContentType,
                                            title,
                                            imageUrl,
                                            description
                                        );

                                        if (saved) {
                                            await fetchQualityUploadsFromSupabase();
                                            (document.getElementById('qualityItemTitle') as HTMLInputElement).value = '';
                                            (document.getElementById('qualityItemDesc') as HTMLTextAreaElement).value = '';
                                            fileInput.value = '';
                                            alert('✅ Item added!');
                                        }
                                    } catch (err) {
                                        console.error('Error adding item:', err);
                                        alert('Failed to add item. Please try again.');
                                    }
                                }}
                                className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                            >
                                Add Item
                            </button>
                        </div>
                    )}

                    {/* Display Current Items */}
                    {qualitySubcategory && qualityContentType && (
                        <div>
                            <h3 className="font-bold mb-4">Current Items ({selectedQualityCategory} / {qualitySubcategory} / {qualityContentType})</h3>
                            {(() => {
                                const key = `${selectedQualityCategory}_${qualitySubcategory}_${qualityContentType}`;
                                const items = qualityContent[key] || [];
                                return items.length > 0 ? (
                                    <div className="grid md:grid-cols-3 gap-6">
                                        {items.map((item: any) => (
                                            <div key={item.id} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden group">
                                                <div className="aspect-video overflow-hidden relative">
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Delete this item?')) return;
                                                            await deleteQualityUploadFromSupabase(item.id);
                                                            await fetchQualityUploadsFromSupabase();
                                                        }}
                                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="p-4">
                                                    <h4 className="font-bold">{item.title}</h4>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-zinc-50 rounded-2xl">
                                        <p className="text-zinc-400">No items added yet. Add your first item above.</p>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <ProductModal
                    product={editingProduct}
                    onClose={closeModal}
                    onSave={(product) => {
                        if (editingProduct) {
                            const updated = products.map(p => p.id === product.id ? product : p);
                            setProducts(updated);
                            localStorage.setItem('arovaveProducts', JSON.stringify(updated));
                            // Save trending products to localStorage
                            const trendingIds = updated.filter(p => p.isTrending).map(p => p.id);
                            localStorage.setItem('arovaveTrendingProducts', JSON.stringify(trendingIds));
                        } else {
                            const newId = Math.max(...products.map(p => p.id)) + 1;
                            const newProduct = { ...product, id: newId };
                            const updated = [...products, newProduct];
                            setProducts(updated);
                            localStorage.setItem('arovaveProducts', JSON.stringify(updated));
                            // Save trending products to localStorage
                            const trendingIds = updated.filter(p => p.isTrending).map(p => p.id);
                            localStorage.setItem('arovaveTrendingProducts', JSON.stringify(trendingIds));
                        }
                        closeModal();
                    }}
                />
            )}

            {/* Settings Tab */}
            {tab === 'settings' && (
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                    <div className="p-6 border-b border-zinc-100">
                        <h3 className="font-black uppercase tracking-widest text-sm">Website Settings</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">
                                Landing Page Background Video
                            </label>

                            {/* File Upload - Upload to Supabase Storage */}
                            <input
                                type="file"
                                accept="video/mp4,video/webm,video/ogg"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // Max 50MB for Supabase Storage
                                        if (file.size > 50 * 1024 * 1024) {
                                            alert('Video file too large! Maximum 50MB allowed.');
                                            return;
                                        }

                                        setIsSavingVideo(true);
                                        try {
                                            // Generate unique filename
                                            const filename = `background_${Date.now()}.${file.name.split('.').pop()}`;

                                            // Upload to Supabase Storage
                                            const { data: uploadData, error: uploadError } = await supabase.storage
                                                .from('videos')
                                                .upload(filename, file, {
                                                    cacheControl: '3600',
                                                    upsert: true
                                                });

                                            if (uploadError) {
                                                console.error('Upload error:', uploadError);
                                                alert('Failed to upload video: ' + uploadError.message);
                                                return;
                                            }

                                            // Get public URL
                                            const { data: urlData } = supabase.storage
                                                .from('videos')
                                                .getPublicUrl(filename);

                                            const publicUrl = urlData.publicUrl;

                                            // Save URL to site_settings
                                            await saveVideoUrl(publicUrl);
                                            setVideoUrl(publicUrl);

                                        } catch (err) {
                                            console.error('Upload error:', err);
                                            alert('Failed to upload video. Please try again.');
                                        } finally {
                                            setIsSavingVideo(false);
                                        }
                                    }
                                }}
                                disabled={isSavingVideo}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-black file:text-white file:cursor-pointer disabled:opacity-50"
                            />
                            <p className="text-xs text-zinc-400 mt-2">
                                {isSavingVideo ? 'Uploading video...' : 'Upload .mp4, .webm or .ogg video (max 50MB). Short looping video recommended.'}
                            </p>

                            {/* Or URL Input */}
                            <div className="mt-4 pt-4 border-t border-zinc-100">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Or enter video URL</p>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={videoUrl.startsWith('data:') ? '' : videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://example.com/video.mp4"
                                        className="flex-1 px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none text-sm"
                                    />
                                    <button
                                        onClick={() => saveVideoUrl(videoUrl)}
                                        disabled={isSavingVideo}
                                        className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                    >
                                        {isSavingVideo ? 'Saving...' : 'Save URL'}
                                    </button>
                                </div>
                            </div>

                            {/* Preview */}
                            {videoUrl && (
                                <div className="mt-4 pt-4 border-t border-zinc-100">
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Current Video Preview</p>
                                    <video
                                        src={videoUrl}
                                        className="w-full max-w-md rounded-xl"
                                        controls
                                        muted
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Categories Tab (Super Admin Only) */}
            {tab === 'categories' && isSuperAdmin && (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                        <div className="p-6 border-b border-zinc-100">
                            <h3 className="font-black uppercase tracking-widest text-sm">Manage Subcategories</h3>
                            <p className="text-zinc-500 text-sm mt-2">Add or remove subcategories for each product category.</p>
                        </div>
                        <div className="p-6">
                            {/* Category Selector */}
                            <div className="mb-6">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Select Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {managedCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategoryForSubcat(cat.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${selectedCategoryForSubcat === cat.id
                                                ? 'bg-black text-white'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Add New Subcategory */}
                            <div className="mb-6 p-4 bg-zinc-50 rounded-xl">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Add New Subcategory</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubcategoryName}
                                        onChange={e => setNewSubcategoryName(e.target.value)}
                                        placeholder="e.g., Organic Products"
                                        className="flex-1 px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            if (!newSubcategoryName.trim()) return;
                                            const updatedCategories = managedCategories.map(cat => {
                                                if (cat.id === selectedCategoryForSubcat) {
                                                    const newId = newSubcategoryName.toLowerCase().replace(/\s+/g, '-');
                                                    if (cat.subcategories.some(s => s.id === newId)) {
                                                        alert('Subcategory already exists!');
                                                        return cat;
                                                    }
                                                    return {
                                                        ...cat,
                                                        subcategories: [...cat.subcategories, { id: newId, name: newSubcategoryName.trim() }]
                                                    };
                                                }
                                                return cat;
                                            });
                                            setManagedCategories(updatedCategories);
                                            localStorage.setItem('arovaveCategories', JSON.stringify(updatedCategories));
                                            // Save to Supabase for persistence
                                            const updatedCat = updatedCategories.find(c => c.id === selectedCategoryForSubcat);
                                            if (updatedCat) {
                                                saveCategoryToSupabase(updatedCat.id, updatedCat.subcategories);
                                            }
                                            setNewSubcategoryName('');
                                        }}
                                        className="px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>

                            {/* Subcategory List */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3">
                                    Current Subcategories ({managedCategories.find(c => c.id === selectedCategoryForSubcat)?.subcategories.length || 0})
                                </label>
                                <div className="space-y-2">
                                    {managedCategories.find(c => c.id === selectedCategoryForSubcat)?.subcategories.map((subcat, idx) => (
                                        <div key={subcat.id} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">{idx + 1}</span>
                                                <span className="font-semibold">{subcat.name}</span>
                                                <span className="text-xs text-zinc-400">({subcat.id})</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!confirm(`Delete subcategory "${subcat.name}"?`)) return;
                                                    const updatedCategories = managedCategories.map(cat => {
                                                        if (cat.id === selectedCategoryForSubcat) {
                                                            return {
                                                                ...cat,
                                                                subcategories: cat.subcategories.filter(s => s.id !== subcat.id)
                                                            };
                                                        }
                                                        return cat;
                                                    });
                                                    setManagedCategories(updatedCategories);
                                                    localStorage.setItem('arovaveCategories', JSON.stringify(updatedCategories));
                                                    // Save to Supabase for persistence
                                                    const updatedCat = updatedCategories.find(c => c.id === selectedCategoryForSubcat);
                                                    if (updatedCat) {
                                                        saveCategoryToSupabase(updatedCat.id, updatedCat.subcategories);
                                                    }
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {managedCategories.find(c => c.id === selectedCategoryForSubcat)?.subcategories.length === 0 && (
                                        <p className="text-zinc-400 text-sm text-center py-4">No subcategories yet. Add one above.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Tab */}
            {tab === 'support' && (isSuperAdmin || hasPermission('enquiries')) && (
                <div className="space-y-6">
                    {/* Header with filter */}
                    <div className="flex items-center justify-between">
                        <h3 className="font-black uppercase tracking-widest text-sm">Support Tickets</h3>
                        <div className="flex gap-2">
                            {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSupportStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest ${supportStatusFilter === status
                                        ? 'bg-black text-white'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                        }`}
                                >
                                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected Ticket View */}
                    {selectedSupportTicket ? (
                        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                            {/* Ticket Header */}
                            <div className="p-6 border-b border-zinc-100">
                                <button
                                    onClick={() => { setSelectedSupportTicket(null); setSupportMessages([]); }}
                                    className="text-sm text-zinc-400 hover:text-black mb-4 flex items-center gap-2"
                                >
                                    ← Back to Tickets
                                </button>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-black mb-1">{selectedSupportTicket.subject}</h2>
                                        <p className="text-sm text-zinc-400">
                                            From: {selectedSupportTicket.user_name} ({selectedSupportTicket.user_email})
                                        </p>
                                        <p className="text-sm text-zinc-400">
                                            {problemTypeLabels[selectedSupportTicket.problem_type] || selectedSupportTicket.problem_type} • {new Date(selectedSupportTicket.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <select
                                        value={selectedSupportTicket.status}
                                        onChange={e => updateTicketStatus(selectedSupportTicket.id, e.target.value)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${supportStatusConfig[selectedSupportTicket.status]?.color}`}
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="p-6 max-h-96 overflow-y-auto space-y-4 bg-zinc-50">
                                {supportMessages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[75%] rounded-2xl p-4 ${msg.sender_type === 'admin'
                                            ? 'bg-black text-white'
                                            : 'bg-white border-2 border-zinc-200'
                                            }`}>
                                            <p className={`text-xs font-bold mb-1 ${msg.sender_type === 'admin' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                    </div>
                                ))}
                                {supportMessages.length === 0 && (
                                    <p className="text-center text-zinc-400 py-8">No messages yet.</p>
                                )}
                            </div>

                            {/* Reply Input */}
                            <div className="p-4 border-t border-zinc-100 flex gap-3">
                                <input
                                    type="text"
                                    value={supportReply}
                                    onChange={e => setSupportReply(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendSupportReply()}
                                    placeholder="Type your reply..."
                                    className="flex-1 px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                />
                                <button
                                    onClick={sendSupportReply}
                                    disabled={!supportReply.trim()}
                                    className="px-6 py-3 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Ticket List */
                        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                            {loadingSupport ? (
                                <div className="p-12 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
                                </div>
                            ) : supportTickets.filter(t => supportStatusFilter === 'all' || t.status === supportStatusFilter).length === 0 ? (
                                <div className="p-12 text-center">
                                    <MessageCircle className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                                    <p className="text-zinc-400">No support tickets found.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {supportTickets
                                        .filter(t => supportStatusFilter === 'all' || t.status === supportStatusFilter)
                                        .map(ticket => (
                                            <button
                                                key={ticket.id}
                                                onClick={() => { setSelectedSupportTicket(ticket); loadSupportMessages(ticket.id); }}
                                                className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${supportStatusConfig[ticket.status]?.color}`}>
                                                        <MessageCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold">{ticket.subject}</h3>
                                                        <p className="text-sm text-zinc-400">
                                                            {ticket.user_name} • {problemTypeLabels[ticket.problem_type] || ticket.problem_type} • {new Date(ticket.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${supportStatusConfig[ticket.status]?.color}`}>
                                                    {supportStatusConfig[ticket.status]?.label}
                                                </span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Product Modal Component
interface ProductModalProps {
    product: Product | null;
    onClose: () => void;
    onSave: (product: Product) => void;
}

function ProductModal({ product, onClose, onSave }: ProductModalProps) {
    // Find default image index (0 if not set)
    const initialDefaultIndex = product?.images?.findIndex(img => img === product?.thumbnail) ?? 0;

    const [formData, setFormData] = useState({
        name: product?.name || '',
        cat: product?.cat || 'food',
        subcategory: product?.subcategory || '',
        hsn: product?.hsn || '',
        moq: product?.moq || '',
        priceRange: product?.priceRange || '',
        description: product?.description || '',
        certifications: product?.certifications.join(', ') || '',
        images: product?.images || [],
        video: product?.video || '',
        isTrending: product?.isTrending || false,
        // Specs as array of key-value pairs
        specs: [
            ...(product?.specs?.map(s => ({ key: s.label, value: s.value })) || []),
            ...(product?.keySpecs?.map(s => ({ key: s.key, value: s.value })) || [])
        ] as { key: string; value: string }[],
        // Tab contents
        tabDescription: product?.tabDescription || '',
        tabSpecifications: product?.tabSpecifications || '',
        tabAdvantage: product?.tabAdvantage || '',
        tabBenefit: product?.tabBenefit || ''
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images || []);
    const [defaultImageIndex, setDefaultImageIndex] = useState<number>(initialDefaultIndex >= 0 ? initialDefaultIndex : 0);

    // Get subcategories for selected category
    const currentCategory = categories.find(c => c.id === formData.cat);
    const subcategories = currentCategory?.subcategories || [];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                setImagePreviews(prev => [...prev, url]);
                setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            setFormData(prev => ({ ...prev, video: url }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reorder images so default is first
        const orderedImages = formData.images.length ? [...formData.images] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];
        if (defaultImageIndex > 0 && defaultImageIndex < orderedImages.length) {
            const defaultImg = orderedImages.splice(defaultImageIndex, 1)[0];
            orderedImages.unshift(defaultImg);
        }

        const productData: Product = {
            id: product?.id || 0,
            name: formData.name,
            cat: formData.cat,
            subcategory: formData.subcategory || undefined,
            hsn: formData.hsn,
            moq: formData.moq,
            priceRange: formData.priceRange,
            description: formData.description,
            certifications: formData.certifications.split(',').map(s => s.trim()).filter(Boolean),
            images: orderedImages,
            thumbnail: orderedImages[0], // First image is both thumbnail and default
            video: formData.video || undefined,
            specs: formData.specs.filter(s => s.key && s.value).map(s => ({ label: s.key, value: s.value })),
            isTrending: formData.isTrending,
            // Tab contents
            tabDescription: formData.tabDescription || undefined,
            tabSpecifications: formData.tabSpecifications || undefined,
            tabAdvantage: formData.tabAdvantage || undefined,
            tabBenefit: formData.tabBenefit || undefined
        };

        onSave(productData);
    };

    return (
        <div className="modal-overlay fixed inset-0" onClick={onClose}>
            <div data-lenis-prevent className="bg-white p-8 rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Product Name*</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Category*</label>
                            <select
                                value={formData.cat}
                                onChange={e => setFormData({ ...formData, cat: e.target.value, subcategory: '' })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none bg-white"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        {subcategories.length > 0 && (
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Subcategory*</label>
                                <select
                                    required
                                    value={formData.subcategory}
                                    onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none bg-white"
                                >
                                    <option value="">Select Subcategory</option>
                                    {subcategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">HSN Code*</label>
                            <input
                                type="text"
                                required
                                value={formData.hsn}
                                onChange={e => setFormData({ ...formData, hsn: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">MOQ*</label>
                            <input
                                type="text"
                                required
                                value={formData.moq}
                                onChange={e => setFormData({ ...formData, moq: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Price Range*</label>
                            <input
                                type="text"
                                required
                                value={formData.priceRange}
                                onChange={e => setFormData({ ...formData, priceRange: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isTrending}
                                    onChange={e => setFormData({ ...formData, isTrending: e.target.checked })}
                                    className="w-5 h-5 rounded border-2 border-zinc-300 text-black focus:ring-black"
                                />
                                <span className="text-sm font-bold">Show in Trending Products</span>
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Description*</label>
                            <textarea
                                required
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none resize-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Product Images*</label>
                            <div
                                className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer"
                                onClick={() => document.getElementById('prod-images')?.click()}
                            >
                                <input type="file" id="prod-images" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                                <ImagePlus className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                                <p className="text-sm font-semibold text-zinc-600">Click to upload images</p>
                            </div>
                            {imagePreviews.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {imagePreviews.map((img, idx) => (
                                        <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-zinc-200">
                                            <img src={img} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Product Video (Optional)</label>
                            <div
                                className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer"
                                onClick={() => document.getElementById('prod-video')?.click()}
                            >
                                <input type="file" id="prod-video" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                                <Video className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                                <p className="text-sm font-semibold text-zinc-600">Click to upload video</p>
                            </div>
                            {formData.video && (
                                <div className="mt-3">
                                    <video src={formData.video} className="w-full max-h-32 rounded-lg object-cover" controls />
                                </div>
                            )}
                        </div>
                        {/* Specifications - Dynamic Key-Value Inputs */}
                        <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Specifications</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        specs: [...prev.specs, { key: '', value: '' }]
                                    }))}
                                    className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </div>
                            {formData.specs.length === 0 ? (
                                <p className="text-xs text-zinc-500 text-center py-4 border-2 border-dashed border-zinc-200 rounded-xl">No specs added. Click "Add" to add one.</p>
                            ) : (
                                <div className="space-y-2">
                                    {formData.specs.map((spec, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={spec.key}
                                                onChange={e => {
                                                    const newSpecs = [...formData.specs];
                                                    newSpecs[idx] = { ...newSpecs[idx], key: e.target.value };
                                                    setFormData({ ...formData, specs: newSpecs });
                                                }}
                                                placeholder="Key (e.g., Weight)"
                                                className="flex-1 px-3 py-2 border-2 border-zinc-200 rounded-lg font-semibold focus:border-black focus:outline-none text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={spec.value}
                                                onChange={e => {
                                                    const newSpecs = [...formData.specs];
                                                    newSpecs[idx] = { ...newSpecs[idx], value: e.target.value };
                                                    setFormData({ ...formData, specs: newSpecs });
                                                }}
                                                placeholder="Value (e.g., 500g)"
                                                className="flex-1 px-3 py-2 border-2 border-zinc-200 rounded-lg font-semibold focus:border-black focus:outline-none text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSpecs = formData.specs.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, specs: newSpecs });
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Certifications (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.certifications}
                                onChange={e => setFormData({ ...formData, certifications: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                            />
                        </div>

                        {/* Default Image Selection */}
                        {imagePreviews.length > 0 && (
                            <div className="md:col-span-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Click image to set as default (first / thumbnail):</p>
                                <div className="flex flex-wrap gap-2">
                                    {imagePreviews.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setDefaultImageIndex(idx)}
                                            className={`w-16 h-16 rounded-lg overflow-hidden cursor-pointer transition-all relative ${defaultImageIndex === idx
                                                ? 'ring-4 ring-black ring-offset-2'
                                                : 'border-2 border-zinc-200 hover:border-zinc-400'
                                                }`}
                                        >
                                            <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                            {defaultImageIndex === idx && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tab Contents Section */}
                        <div className="md:col-span-2 bg-blue-50 rounded-xl p-4 mt-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">Tab Contents (for product detail page)</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Description Tab</label>
                                    <textarea
                                        rows={3}
                                        value={formData.tabDescription}
                                        onChange={e => setFormData({ ...formData, tabDescription: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none resize-none bg-white"
                                        placeholder="Detailed description for the Description tab..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Specifications Tab</label>
                                    <textarea
                                        rows={3}
                                        value={formData.tabSpecifications}
                                        onChange={e => setFormData({ ...formData, tabSpecifications: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none resize-none bg-white"
                                        placeholder="Technical specifications for the Specifications tab..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Advantage Tab</label>
                                    <textarea
                                        rows={3}
                                        value={formData.tabAdvantage}
                                        onChange={e => setFormData({ ...formData, tabAdvantage: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none resize-none bg-white"
                                        placeholder="Product advantages for the Advantage tab..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Benefit Tab</label>
                                    <textarea
                                        rows={3}
                                        value={formData.tabBenefit}
                                        onChange={e => setFormData({ ...formData, tabBenefit: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none resize-none bg-white"
                                        placeholder="Product benefits for the Benefit tab..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button type="button" onClick={onClose} className="flex-1 py-4 border-2 border-zinc-200 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:border-black transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-4 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-800 transition-colors">
                            {product ? 'Update Product' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
