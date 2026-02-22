import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Inbox, ArrowLeft, Mail, Plus, Edit, Trash2, ImagePlus, Video, X, Award, Utensils, Pill, FlaskConical, Gift, Shield, UserCog, Check, Loader2, FolderOpen, MessageCircle, Send, Clock, Settings, Filter, ChevronDown, Calculator } from 'lucide-react';
import { useEnquiry, useAuth } from '../context';
import { supabase } from '../lib/supabase';
import { products as initialProducts, categories } from '../data';
import { compressImage, compressImages, processVideo, checkVideoSize, formatFileSize } from '../utils/mediaCompression';
import { formatPrice } from '../utils/formatPrice';
import { cacheProducts, loadCachedProducts } from '../utils/productCache';
import { LazyImage } from '../components/LazyImage';
import { uploadToStorage } from '../utils/storageUpload';
import type { Product, Enquiry } from '../types';
import type { AdminPermission } from '../context/AuthContext';

// INSTANT: Get products from smart cache (text only, no images to avoid quota issues)
const getStoredProducts = (): Product[] => {
    const cached = loadCachedProducts();
    if (cached.length > 0) {
        return cached;
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
    const [tab, setTab] = useState<'users' | 'products' | 'enquiries' | 'quality' | 'settings' | 'admins' | 'categories' | 'support' | 'calculator'>('enquiries');
    const { allEnquiries, updateEnquiryStatus, isLoadingEnquiries } = useEnquiry();

    // Products state - INSTANT load from localStorage cache (same pattern as quality content)
    const [products, setProducts] = useState<Product[]>(() => getStoredProducts());
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isLoadingProducts, setIsLoadingProducts] = useState(() => getStoredProducts().length === 0);
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    // Products pagination state
    const PRODUCTS_PAGE_SIZE = 12;
    const [productsDisplayCount, setProductsDisplayCount] = useState(PRODUCTS_PAGE_SIZE);
    const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);

    // Category management state
    const [managedCategories, setManagedCategories] = useState<Category[]>(getStoredCategories);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');
    const [selectedCategoryForSubcat, setSelectedCategoryForSubcat] = useState<string>('food');

    // Admin management state (for superadmins)
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [savingPermissions, setSavingPermissions] = useState<string | null>(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Quality content state
    const [qualityContent, setQualityContent] = useState<Record<string, any[]>>({});
    const [selectedQualityCategory, setSelectedQualityCategory] = useState<string>('food');
    const [qualitySubcategory, setQualitySubcategory] = useState<string>('');
    const [qualityContentType, setQualityContentType] = useState<string>('certificate');
    const [isAddingQualityItem, setIsAddingQualityItem] = useState(false);

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
    const [sendingReply, setSendingReply] = useState(false);
    const [supportStatusFilter, setSupportStatusFilter] = useState<string>('all');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Toast notification state
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Admin login state
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Enquiry filter state
    const currentDate = new Date();
    const [showEnquiryFilters, setShowEnquiryFilters] = useState(false);
    const [enquiryFilterYear, setEnquiryFilterYear] = useState<number>(currentDate.getFullYear());
    const [enquiryFilterMonth, setEnquiryFilterMonth] = useState<number>(currentDate.getMonth() + 1);
    const [enquiryFilterType, setEnquiryFilterType] = useState<'month' | 'range' | 'date'>('month');
    const [enquiryDateFrom, setEnquiryDateFrom] = useState<string>('');
    const [enquiryDateTo, setEnquiryDateTo] = useState<string>('');
    const [enquirySingleDate, setEnquirySingleDate] = useState<string>('');

    // Enquiry pagination state
    const ENQUIRIES_PAGE_SIZE = 12;
    const [enquiriesDisplayCount, setEnquiriesDisplayCount] = useState(ENQUIRIES_PAGE_SIZE);
    const [isLoadingMoreEnquiries, setIsLoadingMoreEnquiries] = useState(false);

    // Users pagination state
    const USERS_PAGE_SIZE = 12;
    const [usersDisplayCount, setUsersDisplayCount] = useState(USERS_PAGE_SIZE);
    const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);

    // Month names for filter
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Year options (last 5 years)
    const yearOptions = [
        currentDate.getFullYear(),
        currentDate.getFullYear() - 1,
        currentDate.getFullYear() - 2,
        currentDate.getFullYear() - 3,
        currentDate.getFullYear() - 4
    ];

    // Filter enquiries based on selected filter type (only when filters are shown)
    const filteredEnquiries = showEnquiryFilters ? allEnquiries.filter(e => {
        const enquiryDate = new Date(e.date);

        if (enquiryFilterType === 'month') {
            return enquiryDate.getFullYear() === enquiryFilterYear &&
                enquiryDate.getMonth() + 1 === enquiryFilterMonth;
        } else if (enquiryFilterType === 'range' && enquiryDateFrom && enquiryDateTo) {
            const from = new Date(enquiryDateFrom);
            const to = new Date(enquiryDateTo);
            to.setHours(23, 59, 59, 999);
            return enquiryDate >= from && enquiryDate <= to;
        } else if (enquiryFilterType === 'date' && enquirySingleDate) {
            const selected = new Date(enquirySingleDate);
            return enquiryDate.toDateString() === selected.toDateString();
        }
        return true;
    }) : allEnquiries;

    // Sort filtered enquiries by date descending
    const sortedFilteredEnquiries = [...filteredEnquiries].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Show notification helper
    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        // Auto-hide after 4 seconds
        setTimeout(() => setNotification(null), 4000);
    };

    // Admin login handler
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError(null);

        try {
            // Sign in with email and password
            const { data, error } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword
            });

            if (error) {
                setLoginError('Invalid email or password');
                setIsLoggingIn(false);
                return;
            }

            // Check if the user is an admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                setLoginError('Access Denied - You are not authorized to access admin panel');
                await supabase.auth.signOut();
                setIsLoggingIn(false);
                return;
            }

            if (profile.role !== 'admin' && profile.role !== 'superadmin') {
                setLoginError('Access Denied - You are not authorized to access admin panel');
                await supabase.auth.signOut();
                setIsLoggingIn(false);
                return;
            }

            // Login successful - page will re-render with admin access
            setIsLoggingIn(false);
        } catch (err) {
            console.error('Login error:', err);
            setLoginError('An error occurred. Please try again.');
            setIsLoggingIn(false);
        }
    };

    // Check if user is logged in and is admin
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    // Fetch video URL from Supabase (cache-first for instant loading)
    const fetchVideoUrl = async () => {
        // INSTANT: Load from cache first
        const cached = localStorage.getItem('arovaveVideoUrl');
        if (cached) {
            setVideoUrl(cached);
        }

        // BACKGROUND: Fetch fresh from Supabase
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('video_url')
                .eq('id', 'global')
                .single();

            if (!error && data?.video_url) {
                setVideoUrl(data.video_url);
                localStorage.setItem('arovaveVideoUrl', data.video_url);
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
        { key: 'quality', label: 'Quality Content', icon: Award },
        { key: 'settings', label: 'Settings', icon: Settings },
        { key: 'categories', label: 'Categories', icon: FolderOpen },
        { key: 'support', label: 'Support', icon: MessageCircle }
    ];

    // Fetch all users (for superadmin or admins with users permission)
    const fetchAllUsers = async () => {
        if (!isSuperAdmin && !hasPermission('users')) return;

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

    // Delete a user
    const deleteUser = async (userId: string, userRole: string) => {
        // Prevent deleting superadmins
        if (userRole === 'superadmin') {
            showNotification('Cannot delete superadmin users', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            showNotification('User deleted successfully', 'success');
            await fetchAllUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            showNotification('Failed to delete user', 'error');
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
        if (!supportReply.trim() || !selectedSupportTicket || sendingReply) return;

        setSendingReply(true);
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
        } finally {
            setSendingReply(false);
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

    // Fetch categories from Supabase (cache-first for instant loading)
    const fetchCategoriesFromSupabase = async () => {
        // INSTANT: Load from cache first (already done in getStoredCategories)
        // BACKGROUND: Fetch fresh from Supabase
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
                localStorage.setItem('arovaveCategories', JSON.stringify(formattedCategories));
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    // Save category to Supabase
    const saveCategoryToSupabase = async (categoryId: string, subcategories: { id: string; name: string }[]) => {
        try {
            const { error } = await supabase
                .from('categories')
                .update({
                    subcategories: subcategories
                })
                .eq('id', categoryId);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            console.log('Category saved to Supabase:', categoryId);
        } catch (err) {
            console.error('Error saving category:', err);
            throw err;
        }
    };

    // Fetch quality uploads from Supabase (cache-first for instant loading)
    const fetchQualityUploadsFromSupabase = async () => {
        // INSTANT: Load from cache first
        const cached = localStorage.getItem('arovaveQualityUploads');
        if (cached) {
            try {
                setQualityContent(JSON.parse(cached));
            } catch (e) { }
        }

        // BACKGROUND: Fetch fresh from Supabase
        try {
            const { data, error } = await supabase
                .from('quality_uploads')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
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

        // 2-PHASE LOADING - SAME PATTERN AS CATALOG.TSX (PROVEN TO WORK)
        const fetchProductsFromSupabase = async () => {
            console.log('🔄 Admin Phase 1: Fetching product data (fast)...');
            const startTime = Date.now();
            try {
                // PHASE 1: FAST - Load product data only (no images) - ~130ms
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, cat, subcategory, hsn, moq, price_range, description, certifications, specs, key_specs, is_trending, tab_description, tab_specifications, tab_advantage, tab_benefit, created_at')
                    .order('created_at', { ascending: false });

                const elapsed = Date.now() - startTime;

                if (error) {
                    console.error('❌ Supabase error:', error.message);
                    setIsLoadingProducts(false);
                    return;
                }

                if (!data || data.length === 0) {
                    console.log('📦 Admin: No products found in database');
                    setIsLoadingProducts(false);
                    return;
                }

                // Format products WITHOUT images first (fast)
                const formattedProducts: Product[] = data.map((db: any) => ({
                    id: db.id,
                    name: db.name || '',
                    cat: db.cat || 'food',
                    subcategory: db.subcategory || '',
                    hsn: db.hsn || '',
                    moq: db.moq || '',
                    priceRange: db.price_range || '',
                    description: db.description || '',
                    certifications: db.certifications || [],
                    images: [], // Will be loaded in phase 2
                    video: undefined,
                    thumbnail: '', // Will be loaded in phase 2
                    specs: db.specs || [],
                    keySpecs: db.key_specs || [],
                    isTrending: db.is_trending || false,
                    // Tab contents
                    tabDescription: db.tab_description || '',
                    tabSpecifications: db.tab_specifications || '',
                    tabAdvantage: db.tab_advantage || '',
                    tabBenefit: db.tab_benefit || ''
                }));

                console.log(`✅ Admin Phase 1 complete: ${formattedProducts.length} products in ${elapsed}ms`);
                setProducts(formattedProducts);
                setIsLoadingProducts(false); // Show products immediately!

                // PHASE 2: Load images in BATCHES to avoid timeout (base64 data is huge)
                console.log('🔄 Admin Phase 2: Loading images in batches...');
                const BATCH_SIZE = 5; // Fetch 5 products at a time
                const imageMap = new Map<number, { images: string[]; thumbnail: string }>();

                for (let i = 0; i < data.length; i += BATCH_SIZE) {
                    const batchIds = data.slice(i, i + BATCH_SIZE).map((p: any) => p.id);
                    try {
                        const { data: imageData, error: imgError } = await supabase
                            .from('products')
                            .select('id, images, thumbnail')
                            .in('id', batchIds);

                        if (!imgError && imageData) {
                            imageData.forEach((t: any) => {
                                imageMap.set(t.id, {
                                    images: t.images || [],
                                    thumbnail: t.thumbnail || (t.images && t.images[0]) || ''
                                });
                            });
                        }
                    } catch (batchErr) {
                        console.warn(`⚠️ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed, continuing...`);
                    }
                }

                // Update products with images
                const productsWithImages = formattedProducts.map(p => ({
                    ...p,
                    images: imageMap.get(p.id)?.images || [],
                    thumbnail: imageMap.get(p.id)?.thumbnail || ''
                }));
                setProducts(productsWithImages);
                console.log(`✅ Admin Phase 2 complete: Images loaded`);

                // Save to cache (with CDN thumbnails, not base64)
                cacheProducts(productsWithImages);
            } catch (err) {
                console.error('❌ Error fetching products:', err);
                setIsLoadingProducts(false);
            }
        };

        fetchProductsFromSupabase();

        // Load quality uploads from Supabase
        fetchQualityUploadsFromSupabase();

        // Load video URL from Supabase
        fetchVideoUrl();

        // Load categories from Supabase
        fetchCategoriesFromSupabase();

        // AUTO-MIGRATION: Run image migration on admin load (only once)
        const runAutoMigration = async () => {
            try {
                const { checkMigrationStatus, runMigration } = await import('../utils/imageMigration');
                const status = await checkMigrationStatus();
                if (status.withBase64 > 0) {
                    console.log('🚀 Auto-migration: Found', status.withBase64, 'products to migrate');
                    await runMigration();
                    console.log('✅ Auto-migration complete!');
                } else {
                    console.log('✅ All images already migrated to CDN');
                }
            } catch (err) {
                console.error('Auto-migration error:', err);
            }
        };
        runAutoMigration();

        // Load users for superadmin or admins with users permission
        // And set up real-time subscription for profile updates
        if (isSuperAdmin || hasPermission('users')) {
            fetchAllUsers();

            // Subscribe to profile changes for real-time updates
            const profilesSubscription = supabase
                .channel('admin-profiles-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                    console.log('📡 Profile updated, refreshing users list...');
                    fetchAllUsers();
                })
                .subscribe();

            return () => {
                profilesSubscription.unsubscribe();
            };
        }
    }, [isSuperAdmin, hasPermission]);

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

    const handleDeleteProduct = async (id: number) => {
        if (confirm('Delete this product?')) {
            setIsSavingProduct(true);
            try {
                const { error } = await supabase.from('products').delete().eq('id', id);

                if (error) {
                    showNotification('Failed to delete product: ' + error.message, 'error');
                    setIsSavingProduct(false);
                    return;
                }

                // Remove from local state
                const updatedProducts = products.filter(p => p.id !== id);
                setProducts(updatedProducts);

                // CRITICAL: Also update cache to keep in sync
                cacheProducts(updatedProducts);
                showNotification('Product deleted successfully', 'success');
            } catch (err: any) {
                console.error('Error deleting product:', err);
                showNotification(err.message || 'Failed to delete product', 'error');
            } finally {
                setIsSavingProduct(false);
            }
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
            {/* Toast Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-pulse ${notification.type === 'success'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    <span className="font-semibold">{notification.message}</span>
                    <button
                        onClick={() => setNotification(null)}
                        className="ml-2 hover:opacity-75"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Admin Login Form - Show if not logged in or not admin */}
            {!isAdmin ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <Shield className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Admin Login</h1>
                            <p className="text-zinc-500">Enter your admin credentials to continue</p>
                        </div>

                        <form onSubmit={handleAdminLogin} className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-xl">
                            {loginError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {loginError}
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={adminEmail}
                                    onChange={e => setAdminEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoggingIn}
                                className="w-full py-4 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoggingIn ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        Sign In to Admin
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-zinc-400 text-sm mt-6">
                            <Link to="/" className="hover:text-black transition-colors">← Back to Home</Link>
                        </p>
                    </div>
                </div>
            ) : (
                <>
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
                        {(isSuperAdmin || hasPermission('quality')) && (
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
                                <Settings className="w-4 h-4" /> Settings
                            </button>
                        )}
                        {(isSuperAdmin || hasPermission('categories')) && (
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
                        {(isSuperAdmin || hasPermission('support')) && (
                            <button
                                onClick={() => { setTab('support'); loadSupportTickets(); }}
                                className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'support' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                            >
                                <MessageCircle className="w-4 h-4" /> Support
                            </button>
                        )}
                        {isSuperAdmin && (
                            <button
                                onClick={() => setTab('calculator')}
                                className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'calculator' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                            >
                                <Calculator className="w-4 h-4" /> Calculator
                            </button>
                        )}
                    </div>

                    {/* Calculator Tab */}
                    {tab === 'calculator' && (
                        <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                            <div className="text-center">
                                <Calculator className="w-16 h-16 mx-auto text-zinc-300 mb-6" />
                                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Arovave Global Calculator</h2>
                                <p className="text-zinc-500 mb-8">Open the calculator in a new full-page tab</p>
                                <a
                                    href="https://arovave-global-calculator-real.vercel.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    <Calculator className="w-5 h-5" />
                                    Open Calculator in Full Page
                                </a>
                            </div>
                        </div>
                    )}

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
                            <div className="p-4 sm:p-6 border-b border-zinc-100">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <h3 className="font-black uppercase tracking-widest text-sm">All Registered Users ({allUsers.length})</h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search by name, email or phone..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="w-full sm:w-64 px-4 py-2 pl-10 border-2 border-zinc-200 rounded-xl text-sm focus:border-black focus:outline-none"
                                        />
                                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
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
                                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden sm:table-cell">Country</th>
                                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone</th>
                                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Role</th>
                                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hidden sm:table-cell">Joined</th>
                                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const filteredUsersList = allUsers.filter(user => {
                                                    if (!userSearchQuery.trim()) return true;
                                                    const query = userSearchQuery.toLowerCase();
                                                    return (
                                                        (user.name?.toLowerCase() || '').includes(query) ||
                                                        (user.email?.toLowerCase() || '').includes(query) ||
                                                        (user.phone?.toLowerCase() || '').includes(query)
                                                    );
                                                });
                                                return filteredUsersList.slice(0, usersDisplayCount).map((user) => (
                                                    <tr key={user.id} className="border-t border-zinc-50">
                                                        <td className="p-4 font-semibold text-sm">{user.name || '-'}</td>
                                                        <td className="p-4 text-zinc-600 text-sm truncate max-w-[120px] sm:max-w-none">{user.email}</td>
                                                        <td className="p-4 text-zinc-600 hidden sm:table-cell">{user.country || '-'}</td>
                                                        <td className="p-4 text-amber-600 text-sm font-semibold">{user.phone || '-'}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                                                user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-zinc-100 text-zinc-600'
                                                                }`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-zinc-400 text-sm hidden sm:table-cell">{user.created_at?.split('T')[0] || '-'}</td>
                                                        <td className="p-4">
                                                            {user.role !== 'superadmin' && (
                                                                <button
                                                                    onClick={() => deleteUser(user.id, user.role)}
                                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Delete user"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ));
                                            })()}
                                        </tbody>
                                    </table>

                                    {/* Load More Button for Users */}
                                    {(() => {
                                        const filteredUsersList = allUsers.filter(user => {
                                            if (!userSearchQuery.trim()) return true;
                                            const query = userSearchQuery.toLowerCase();
                                            return (
                                                (user.name?.toLowerCase() || '').includes(query) ||
                                                (user.email?.toLowerCase() || '').includes(query) ||
                                                (user.phone?.toLowerCase() || '').includes(query)
                                            );
                                        });
                                        return usersDisplayCount < filteredUsersList.length && (
                                            <div className="flex justify-center p-6 border-t border-zinc-100">
                                                <button
                                                    onClick={() => {
                                                        setIsLoadingMoreUsers(true);
                                                        setTimeout(() => {
                                                            setUsersDisplayCount(prev => prev + USERS_PAGE_SIZE);
                                                            setIsLoadingMoreUsers(false);
                                                        }, 300);
                                                    }}
                                                    disabled={isLoadingMoreUsers}
                                                    className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                                >
                                                    {isLoadingMoreUsers ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            Load More ({filteredUsersList.length - usersDisplayCount} remaining)
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Products Tab */}
                    {tab === 'products' && (isSuperAdmin || hasPermission('products')) && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-zinc-500 text-sm">
                                    {isLoadingProducts ? 'Loading...' : `${products.length} products`}
                                </p>
                                <button
                                    onClick={() => setShowProductModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Add Product
                                </button>
                            </div>

                            {/* Loading skeleton */}
                            {isLoadingProducts && products.length === 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="bg-white rounded-3xl border border-zinc-100 overflow-hidden animate-pulse">
                                            <div className="aspect-video bg-zinc-100" />
                                            <div className="p-5">
                                                <div className="h-3 bg-zinc-100 rounded w-16 mb-2" />
                                                <div className="h-5 bg-zinc-100 rounded w-3/4 mb-2" />
                                                <div className="h-4 bg-zinc-100 rounded w-24 mb-1" />
                                                <div className="h-3 bg-zinc-100 rounded w-32 mb-4" />
                                                <div className="flex gap-2">
                                                    <div className="flex-1 h-9 bg-zinc-100 rounded-lg" />
                                                    <div className="w-12 h-9 bg-zinc-100 rounded-lg" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Products Grid - Text shows immediately, images lazy load */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {products.slice(0, productsDisplayCount).map((p, index) => (
                                    <div key={p.id} className="bg-white rounded-3xl border border-zinc-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                        {/* Priority load first 6 images (above fold), lazy load rest */}
                                        <LazyImage
                                            src={p.thumbnail || p.images[0] || ''}
                                            alt={p.name}
                                            className="aspect-video"
                                            priority={index < 6}
                                        />
                                        {/* Text content shows immediately */}
                                        <div className="p-5">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{p.cat}</span>
                                            <h4 className="font-bold text-lg">{p.name}</h4>
                                            <p className="text-sm text-black font-bold mb-1">{formatPrice(p.priceRange)}</p>
                                            <p className="text-xs text-zinc-400 mb-4">MOQ: {p.moq} | HSN: {p.hsn}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(p)}
                                                    className="flex-1 py-2 border-2 border-zinc-200 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-black transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Edit className="w-3 h-3" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(p.id)}
                                                    className="px-4 py-2 border-2 border-red-200 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {productsDisplayCount < products.length && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={() => {
                                            setIsLoadingMoreProducts(true);
                                            setTimeout(() => {
                                                setProductsDisplayCount(prev => prev + PRODUCTS_PAGE_SIZE);
                                                setIsLoadingMoreProducts(false);
                                            }, 300);
                                        }}
                                        disabled={isLoadingMoreProducts}
                                        className="flex items-center gap-2 px-8 py-3 bg-zinc-100 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                    >
                                        {isLoadingMoreProducts ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4" />
                                                Load More ({products.length - productsDisplayCount} remaining)
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* All products loaded message */}
                            {productsDisplayCount >= products.length && products.length > PRODUCTS_PAGE_SIZE && (
                                <p className="text-center text-zinc-400 text-sm mt-6">
                                    All {products.length} products loaded
                                </p>
                            )}
                        </div>
                    )}

                    {/* Enquiries Tab */}
                    {tab === 'enquiries' && (isSuperAdmin || hasPermission('enquiries')) && (
                        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100">
                                <div className="flex justify-between items-center flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-black uppercase tracking-widest text-sm">
                                            Enquiries ({sortedFilteredEnquiries.length}{showEnquiryFilters ? ` of ${allEnquiries.length}` : ''})
                                        </h3>
                                        <button
                                            onClick={() => setShowEnquiryFilters(!showEnquiryFilters)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${showEnquiryFilters ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                        >
                                            <Filter className="w-3 h-3" />
                                            Filter
                                        </button>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[9px] font-bold rounded-full">
                                            Pending: {sortedFilteredEnquiries.filter(e => e.status === 'pending').length}
                                        </span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-full">
                                            Contacted: {sortedFilteredEnquiries.filter(e => e.status === 'contacted').length}
                                        </span>
                                        <span className="px-3 py-1 bg-green-50 text-green-700 text-[9px] font-bold rounded-full">
                                            Completed: {sortedFilteredEnquiries.filter(e => e.status === 'completed-win' || e.status === 'completed-loss').length}
                                        </span>
                                    </div>
                                </div>

                                {/* Filter Panel */}
                                {showEnquiryFilters && (
                                    <div className="mt-4 p-4 bg-zinc-50 rounded-xl animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex flex-wrap gap-4 items-center">
                                            <div className="flex gap-2 bg-white rounded-xl p-1 border border-zinc-200">
                                                <button
                                                    onClick={() => setEnquiryFilterType('month')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${enquiryFilterType === 'month' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                                >
                                                    Month
                                                </button>
                                                <button
                                                    onClick={() => setEnquiryFilterType('range')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${enquiryFilterType === 'range' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                                >
                                                    Date Range
                                                </button>
                                                <button
                                                    onClick={() => setEnquiryFilterType('date')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${enquiryFilterType === 'date' ? 'bg-black text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                                                >
                                                    Specific Date
                                                </button>
                                            </div>

                                            {enquiryFilterType === 'month' && (
                                                <div className="flex gap-2">
                                                    <select
                                                        value={enquiryFilterMonth}
                                                        onChange={e => setEnquiryFilterMonth(Number(e.target.value))}
                                                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-black cursor-pointer"
                                                    >
                                                        {monthNames.map((month, idx) => (
                                                            <option key={idx + 1} value={idx + 1}>{month}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={enquiryFilterYear}
                                                        onChange={e => setEnquiryFilterYear(Number(e.target.value))}
                                                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-black cursor-pointer"
                                                    >
                                                        {yearOptions.map(year => (
                                                            <option key={year} value={year}>{year}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {enquiryFilterType === 'range' && (
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="date"
                                                        value={enquiryDateFrom}
                                                        onChange={e => setEnquiryDateFrom(e.target.value)}
                                                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-black"
                                                    />
                                                    <span className="text-zinc-400 text-sm">to</span>
                                                    <input
                                                        type="date"
                                                        value={enquiryDateTo}
                                                        onChange={e => setEnquiryDateTo(e.target.value)}
                                                        className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-black"
                                                    />
                                                </div>
                                            )}

                                            {enquiryFilterType === 'date' && (
                                                <input
                                                    type="date"
                                                    value={enquirySingleDate}
                                                    onChange={e => setEnquirySingleDate(e.target.value)}
                                                    className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-black"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-zinc-50">
                                        <tr>
                                            <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">ID</th>
                                            <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Customer</th>
                                            <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone</th>
                                            <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Products</th>
                                            <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
                                            <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedFilteredEnquiries.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-zinc-400">
                                                    No enquiries found for the selected period.
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedFilteredEnquiries.slice(0, enquiriesDisplayCount).map((enq, index) => (
                                                <tr key={enq.id} className="border-t border-zinc-50 hover:bg-zinc-50">
                                                    <td className="p-4 font-bold text-zinc-400">#{sortedFilteredEnquiries.length - index}</td>
                                                    <td className="p-4">
                                                        <p className="font-bold">{enq.user.name}</p>
                                                        <p className="text-xs text-zinc-400">{enq.user.email}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        {enq.user.phone ? (
                                                            <a href={`tel:${enq.user.phone}`} className="text-sm font-semibold text-blue-600 hover:underline">
                                                                {enq.user.phone}
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-zinc-400">Not provided</span>
                                                        )}
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
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Load More Button for Enquiries */}
                                {enquiriesDisplayCount < sortedFilteredEnquiries.length && (
                                    <div className="flex justify-center p-6 border-t border-zinc-100">
                                        <button
                                            onClick={() => {
                                                setIsLoadingMoreEnquiries(true);
                                                setTimeout(() => {
                                                    setEnquiriesDisplayCount(prev => prev + ENQUIRIES_PAGE_SIZE);
                                                    setIsLoadingMoreEnquiries(false);
                                                }, 300);
                                            }}
                                            disabled={isLoadingMoreEnquiries}
                                            className="flex items-center gap-2 px-6 py-2 bg-zinc-100 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                        >
                                            {isLoadingMoreEnquiries ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-4 h-4" />
                                                    Load More ({sortedFilteredEnquiries.length - enquiriesDisplayCount} remaining)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quality Content Tab */}
                    {tab === 'quality' && (isSuperAdmin || hasPermission('quality')) && (
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
                                                onClick={() => {
                                                    setSelectedQualityCategory(cat.id);
                                                    setQualitySubcategory(''); // Reset subcategory when category changes
                                                    setQualityContentType('certificate'); // Reset content type
                                                }}
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
                                        {managedCategories.find(c => c.id === selectedQualityCategory)?.subcategories
                                            ?.filter(sub => !sub.name.toLowerCase().startsWith('all '))
                                            .map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {/* Content Type Selection */}
                            {qualitySubcategory && (
                                <div className="mb-6">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Content Type</label>
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        {['certificate', 'plant', 'sample'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setQualityContentType(type)}
                                                className={`px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest ${qualityContentType === type
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
                                <div className="bg-zinc-50 rounded-2xl p-4 sm:p-6 mb-8">
                                    <h3 className="font-bold mb-4 text-sm sm:text-base">Add New {qualityContentType === 'certificate' ? 'Certificate' : qualityContentType === 'plant' ? 'Plant Photo' : 'Product Sample'}</h3>
                                    <div className="space-y-4 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            id="qualityItemTitle"
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none text-sm"
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="qualityItemImage"
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none text-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-[10px] sm:file:text-xs file:font-bold file:bg-black file:text-white"
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Description (optional - write about this image)"
                                        id="qualityItemDesc"
                                        rows={3}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-zinc-200 rounded-xl focus:border-black focus:outline-none resize-none mb-4 text-sm"
                                    />
                                    <p className="text-[10px] sm:text-xs text-zinc-400 mb-4">Max 5MB image file. Supports JPG, PNG, WebP.</p>
                                    <button
                                        type="button"
                                        disabled={isAddingQualityItem}
                                        onClick={async () => {
                                            // Prevent double-click
                                            if (isAddingQualityItem) return;

                                            console.log('📝 Add Item button clicked');
                                            const title = (document.getElementById('qualityItemTitle') as HTMLInputElement)?.value?.trim();
                                            const fileInput = document.getElementById('qualityItemImage') as HTMLInputElement;
                                            const description = (document.getElementById('qualityItemDesc') as HTMLTextAreaElement)?.value;
                                            const file = fileInput?.files?.[0];

                                            if (!title) {
                                                alert('Please enter a title');
                                                return;
                                            }
                                            if (!file) {
                                                alert('Please select an image file');
                                                return;
                                            }
                                            if (file.size > 5 * 1024 * 1024) {
                                                alert('Image too large! Max 5MB.');
                                                return;
                                            }

                                            // Check for duplicate title in current items
                                            const key = `${selectedQualityCategory}_${qualitySubcategory}_${qualityContentType}`;
                                            const existingItems = qualityContent[key] || [];
                                            if (existingItems.some((item: any) => item.title.toLowerCase() === title.toLowerCase())) {
                                                alert('An item with this title already exists!');
                                                return;
                                            }

                                            setIsAddingQualityItem(true);
                                            try {
                                                console.log('📝 Uploading image to Supabase Storage...');
                                                // Use unique ID for quality uploads to avoid conflicts
                                                const uniqueId = `quality-${selectedQualityCategory}-${qualitySubcategory}-${Date.now()}`;
                                                const imageUrl = await uploadToStorage(file, uniqueId, 0);
                                                console.log('📝 Image uploaded to storage:', imageUrl);

                                                const saved = await saveQualityUploadToSupabase(
                                                    selectedQualityCategory,
                                                    qualitySubcategory,
                                                    qualityContentType,
                                                    title,
                                                    imageUrl,
                                                    description
                                                );

                                                if (saved) {
                                                    console.log('📝 Item saved successfully!');
                                                    await fetchQualityUploadsFromSupabase();
                                                    (document.getElementById('qualityItemTitle') as HTMLInputElement).value = '';
                                                    (document.getElementById('qualityItemDesc') as HTMLTextAreaElement).value = '';
                                                    fileInput.value = '';
                                                    alert('✅ Item added successfully!');
                                                } else {
                                                    console.error('📝 Save returned null');
                                                    alert('Failed to save item. Check console for details.');
                                                }
                                            } catch (err) {
                                                console.error('📝 Error adding item:', err);
                                                alert('Failed to add item: ' + (err as Error).message);
                                            } finally {
                                                setIsAddingQualityItem(false);
                                            }
                                        }}
                                        className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${isAddingQualityItem ? 'bg-zinc-400 cursor-not-allowed' : 'bg-black text-white hover:bg-zinc-800'}`}
                                    >
                                        {isAddingQualityItem && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {isAddingQualityItem ? 'Adding...' : 'Add Item'}
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
                            managedCategories={managedCategories}
                            isSaving={isSavingProduct}
                            onSave={async (product) => {
                                setIsSavingProduct(true);
                                try {
                                    const isNew = !editingProduct;

                                    // Direct Supabase save
                                    const dbProduct = {
                                        name: product.name,
                                        cat: product.cat,
                                        subcategory: product.subcategory,
                                        hsn: product.hsn,
                                        moq: product.moq,
                                        price_range: product.priceRange,
                                        description: product.description,
                                        certifications: product.certifications,
                                        images: product.images,
                                        video: product.video,
                                        thumbnail: product.thumbnail,
                                        specs: product.specs,
                                        key_specs: product.keySpecs,
                                        is_trending: product.isTrending,
                                        // Tab contents - THESE WERE MISSING!
                                        tab_description: product.tabDescription,
                                        tab_specifications: product.tabSpecifications,
                                        tab_advantage: product.tabAdvantage,
                                        tab_benefit: product.tabBenefit
                                    };

                                    let error;
                                    if (isNew) {
                                        const result = await supabase.from('products').insert(dbProduct);
                                        error = result.error;
                                    } else {
                                        const result = await supabase.from('products').update(dbProduct).eq('id', product.id);
                                        error = result.error;
                                    }

                                    if (error) {
                                        showNotification('Error: ' + error.message, 'error');
                                    } else {
                                        // Refresh products with ALL fields including tab contents
                                        const { data } = await supabase
                                            .from('products')
                                            .select('id, name, cat, subcategory, hsn, moq, price_range, description, certifications, images, video, thumbnail, specs, key_specs, is_trending, tab_description, tab_specifications, tab_advantage, tab_benefit, created_at')
                                            .order('created_at', { ascending: false });

                                        if (data) {
                                            const formattedProducts: Product[] = data.map((db: any) => ({
                                                id: db.id,
                                                name: db.name || '',
                                                cat: db.cat || 'food',
                                                subcategory: db.subcategory || '',
                                                hsn: db.hsn || '',
                                                moq: db.moq || '',
                                                priceRange: db.price_range || '',
                                                description: db.description || '',
                                                certifications: db.certifications || [],
                                                images: db.images || [],
                                                video: db.video || undefined,
                                                thumbnail: db.thumbnail || (db.images?.[0] || ''),
                                                specs: db.specs || [],
                                                keySpecs: db.key_specs || [],
                                                isTrending: db.is_trending || false,
                                                // Tab contents - ADDED!
                                                tabDescription: db.tab_description || '',
                                                tabSpecifications: db.tab_specifications || '',
                                                tabAdvantage: db.tab_advantage || '',
                                                tabBenefit: db.tab_benefit || ''
                                            }));
                                            setProducts(formattedProducts);

                                            // CRITICAL: Update cache (without images to avoid quota issues)
                                            cacheProducts(formattedProducts);
                                        }

                                        closeModal();
                                        showNotification(
                                            isNew ? `Product "${product.name}" added successfully!` : `Product "${product.name}" updated successfully!`,
                                            'success'
                                        );
                                    }
                                } catch (err) {
                                    console.error('Error saving product:', err);
                                    showNotification('Failed to save product. Please try again.', 'error');
                                } finally {
                                    setIsSavingProduct(false);
                                }
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

                    {/* Categories Tab */}
                    {tab === 'categories' && (isSuperAdmin || hasPermission('categories')) && (
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
                                        <div className="flex flex-col sm:flex-row gap-2">
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
                                                <div key={subcat.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-zinc-200 rounded-xl gap-2">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500 flex-shrink-0">{idx + 1}</span>
                                                        <span className="font-semibold truncate">{subcat.name}</span>
                                                        <span className="text-xs text-zinc-400 hidden sm:inline">({subcat.id})</span>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
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
                                                                try {
                                                                    await saveCategoryToSupabase(updatedCat.id, updatedCat.subcategories);
                                                                    alert('✅ Subcategory deleted!');
                                                                } catch (err) {
                                                                    console.error('Error saving to Supabase:', err);
                                                                    alert('Deleted locally but failed to sync to database');
                                                                }
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
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h3 className="font-black uppercase tracking-widest text-sm">Support Tickets</h3>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setSupportStatusFilter(status)}
                                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest ${supportStatusFilter === status
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
                                    <div className="p-4 md:p-6 border-b border-zinc-100">
                                        <button
                                            onClick={() => { setSelectedSupportTicket(null); setSupportMessages([]); }}
                                            className="text-sm text-zinc-400 hover:text-black mb-4 flex items-center gap-2"
                                        >
                                            ← Back to Tickets
                                        </button>
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-lg md:text-xl font-black mb-1 break-words">{selectedSupportTicket.subject}</h2>
                                                <p className="text-xs md:text-sm text-zinc-400 break-words">
                                                    From: {selectedSupportTicket.user_name} ({selectedSupportTicket.user_email})
                                                </p>
                                                <p className="text-xs md:text-sm text-zinc-400">
                                                    {problemTypeLabels[selectedSupportTicket.problem_type] || selectedSupportTicket.problem_type} • {new Date(selectedSupportTicket.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <select
                                                value={selectedSupportTicket.status}
                                                onChange={e => updateTicketStatus(selectedSupportTicket.id, e.target.value)}
                                                className={`self-start px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase ${supportStatusConfig[selectedSupportTicket.status]?.color}`}
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div
                                        ref={chatContainerRef}
                                        onWheel={(e) => {
                                            e.stopPropagation();
                                            const container = chatContainerRef.current;
                                            if (container) {
                                                container.scrollTop += e.deltaY;
                                            }
                                        }}
                                        className="p-4 md:p-6 h-[50vh] md:h-[60vh] max-h-[500px] min-h-[200px] overflow-y-scroll overscroll-contain space-y-3 md:space-y-4 bg-zinc-50"
                                    >
                                        {supportMessages.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3 md:p-4 ${msg.sender_type === 'admin'
                                                    ? 'bg-black text-white'
                                                    : 'bg-white border-2 border-zinc-200'
                                                    }`}>
                                                    <p className={`text-[10px] md:text-xs font-bold mb-1 truncate ${msg.sender_type === 'admin' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                        {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="leading-relaxed whitespace-pre-wrap break-words text-sm md:text-base">{msg.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {supportMessages.length === 0 && (
                                            <p className="text-center text-zinc-400 py-8">No messages yet.</p>
                                        )}
                                    </div>

                                    {/* Reply Input */}
                                    <div className="p-3 md:p-4 border-t border-zinc-100 flex gap-2 md:gap-3">
                                        <input
                                            type="text"
                                            value={supportReply}
                                            onChange={e => setSupportReply(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && sendSupportReply()}
                                            placeholder="Type your reply..."
                                            className="flex-1 min-w-0 px-3 md:px-4 py-2.5 md:py-3 border-2 border-zinc-200 rounded-xl font-semibold text-sm focus:border-black focus:outline-none"
                                        />
                                        <button
                                            onClick={sendSupportReply}
                                            disabled={!supportReply.trim() || sendingReply}
                                            className="px-4 md:px-6 py-2.5 md:py-3 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 flex-shrink-0"
                                        >
                                            {sendingReply ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Ticket List */
                                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                                    {loadingSupport ? (
                                        <div className="p-8 md:p-12 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
                                        </div>
                                    ) : supportTickets.filter(t => supportStatusFilter === 'all' || t.status === supportStatusFilter).length === 0 ? (
                                        <div className="p-8 md:p-12 text-center">
                                            <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-zinc-300 mx-auto mb-4" />
                                            <p className="text-zinc-400 text-sm md:text-base">No support tickets found.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-zinc-100">
                                            {supportTickets
                                                .filter(t => supportStatusFilter === 'all' || t.status === supportStatusFilter)
                                                .map(ticket => (
                                                    <button
                                                        key={ticket.id}
                                                        onClick={() => { setSelectedSupportTicket(ticket); loadSupportMessages(ticket.id); }}
                                                        className="w-full flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 hover:bg-zinc-50 transition-colors text-left gap-3"
                                                    >
                                                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${supportStatusConfig[ticket.status]?.color}`}>
                                                                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h3 className="font-bold text-sm md:text-base truncate">{ticket.subject}</h3>
                                                                <p className="text-xs md:text-sm text-zinc-400 truncate">
                                                                    {ticket.user_name} • {problemTypeLabels[ticket.problem_type] || ticket.problem_type} • {new Date(ticket.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`self-start md:self-center px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase whitespace-nowrap flex-shrink-0 ${supportStatusConfig[ticket.status]?.color}`}>
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
                </>
            )}
        </div>
    );
}

// Product Modal Component
interface ProductModalProps {
    product: Product | null;
    onClose: () => void;
    onSave: (product: Product) => void;
    managedCategories: { id: string; name: string; subcategories: { id: string; name: string }[] }[];
    isSaving?: boolean;
}

function ProductModal({ product, onClose, onSave, managedCategories, isSaving }: ProductModalProps) {
    // Find default image index (0 if not set)
    const initialDefaultIndex = product?.images?.findIndex(img => img === product?.thumbnail) ?? 0;

    const [formData, setFormData] = useState({
        name: product?.name || '',
        cat: product?.cat || 'food',
        subcategory: product?.subcategory || '',
        hsn: product?.hsn || '',
        moq: product?.moq || '',
        price: product?.priceRange?.replace(/[^0-9.-]/g, '') || '',
        priceUnit: product?.priceRange?.includes('/') ? product?.priceRange?.split('/')[1]?.trim() : 'kg',
        description: product?.description || '',
        certifications: product?.certifications.join(', ') || '',
        images: product?.images || [],
        video: product?.video || '',
        isTrending: product?.isTrending || false,
        // Specs as array of key-value pairs - only use keySpecs to prevent duplication
        specs: (product?.keySpecs?.map(s => ({ key: s.key, value: s.value })) || []) as { key: string; value: string }[],
        // Tab contents
        tabDescription: product?.tabDescription || '',
        tabSpecifications: product?.tabSpecifications || '',
        tabAdvantage: product?.tabAdvantage || '',
        tabBenefit: product?.tabBenefit || ''
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images || []);
    const [defaultImageIndex, setDefaultImageIndex] = useState<number>(initialDefaultIndex >= 0 ? initialDefaultIndex : 0);

    // Get subcategories for selected category from managedCategories (Supabase)
    const currentCategory = managedCategories.find(c => c.id === formData.cat);
    const subcategories = currentCategory?.subcategories || [];

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Process each file with compression
        for (const file of Array.from(files)) {
            try {
                console.log(`📸 Processing: ${file.name} (${formatFileSize(file.size)})`);
                const compressed = await compressImage(file);
                setImagePreviews(prev => [...prev, compressed]);
                setFormData(prev => ({ ...prev, images: [...prev.images, compressed] }));
            } catch (error) {
                console.error('Failed to compress image:', error);
                // Fallback to original if compression fails
                const reader = new FileReader();
                reader.onload = (e) => {
                    const url = e.target?.result as string;
                    setImagePreviews(prev => [...prev, url]);
                    setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleDeleteImage = (indexToDelete: number) => {
        setImagePreviews(prev => prev.filter((_, idx) => idx !== indexToDelete));
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== indexToDelete) }));
        // Adjust default image index if needed
        if (defaultImageIndex === indexToDelete) {
            setDefaultImageIndex(0);
        } else if (defaultImageIndex > indexToDelete) {
            setDefaultImageIndex(prev => prev - 1);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log(`🎬 Processing video: ${file.name} (${formatFileSize(file.size)})`);

        // Check video size
        const sizeCheck = checkVideoSize(file);
        if (!sizeCheck.isValid) {
            alert(sizeCheck.message);
            return; // Don't upload if too large
        }

        try {
            const { data, warning } = await processVideo(file);
            if (warning) {
                console.warn('⚠️ Video warning:', warning);
            }
            setFormData(prev => ({ ...prev, video: data }));
            console.log(`🎬 Video processed: ${formatFileSize(file.size)}`);
        } catch (error) {
            console.error('Failed to process video:', error);
            alert('Failed to process video. Please try a different file.');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all required fields (everything except video is mandatory)
        const missingFields: string[] = [];
        if (!formData.name.trim()) missingFields.push('Product Name');
        if (!formData.cat) missingFields.push('Category');
        if (!formData.subcategory) missingFields.push('Subcategory');
        if (!formData.hsn.trim()) missingFields.push('HSN Code');
        if (!formData.moq.trim()) missingFields.push('MOQ');
        if (!formData.price.trim()) missingFields.push('Price');
        if (!formData.priceUnit.trim()) missingFields.push('Unit');
        if (!formData.description.trim()) missingFields.push('Description');
        if (formData.images.length === 0) missingFields.push('At least one Image');
        if (!formData.certifications.trim()) missingFields.push('Certifications');

        if (missingFields.length > 0) {
            alert(`Please fill in the following required fields:\n\n• ${missingFields.join('\n• ')}`);
            return;
        }

        // Reorder images so default is first (no placeholder fallback)
        const orderedImages = formData.images.length ? [...formData.images] : [];
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
            priceRange: `$${formData.price}/${formData.priceUnit}`,
            description: formData.description,
            certifications: formData.certifications.split(',').map(s => s.trim()).filter(Boolean),
            images: orderedImages,
            thumbnail: orderedImages[0], // First image is both thumbnail and default
            video: formData.video || undefined,
            specs: [], // Empty - use keySpecs only to prevent duplication
            keySpecs: formData.specs.filter(s => s.key && s.value).map(s => ({ key: s.key, value: s.value })),
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
        <div className="modal-overlay fixed inset-0 z-50 px-4 md:px-0" onClick={onClose}>
            <div data-lenis-prevent className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[32px] w-full max-w-2xl shadow-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto mx-auto my-4 md:my-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 md:mb-8">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                {managedCategories.map(cat => (
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
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Price (Number Only)*</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-500">$</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="e.g. 100"
                                    className="w-full pl-8 pr-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Unit*</label>
                            <input
                                type="text"
                                required
                                value={formData.priceUnit}
                                onChange={e => setFormData({ ...formData, priceUnit: e.target.value })}
                                placeholder="e.g. kg, piece, box, ton"
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Short Description*</label>
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
                                        <div key={idx} className="relative group">
                                            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-zinc-200">
                                                <img src={img} className="w-full h-full object-cover" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteImage(idx); }}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors shadow-lg"
                                                title="Remove image"
                                            >
                                                ×
                                            </button>
                                            {idx === defaultImageIndex && (
                                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-black text-white text-[8px] font-bold rounded">
                                                    Default
                                                </span>
                                            )}
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Technical Specification</label>
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
                                <div className="space-y-3">
                                    {formData.specs.map((spec, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-2 p-3 bg-zinc-50 rounded-xl">
                                            <input
                                                type="text"
                                                value={spec.key}
                                                onChange={e => {
                                                    const newSpecs = [...formData.specs];
                                                    newSpecs[idx] = { ...newSpecs[idx], key: e.target.value };
                                                    setFormData({ ...formData, specs: newSpecs });
                                                }}
                                                placeholder="Key (e.g., Weight)"
                                                className="flex-1 px-3 py-2 border-2 border-zinc-200 rounded-lg font-semibold focus:border-black focus:outline-none text-sm bg-white"
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
                                                className="flex-1 px-3 py-2 border-2 border-zinc-200 rounded-lg font-semibold focus:border-black focus:outline-none text-sm bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newSpecs = formData.specs.filter((_, i) => i !== idx);
                                                    setFormData({ ...formData, specs: newSpecs });
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors self-end sm:self-center"
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Description and Specification Tab</label>
                                    <textarea
                                        rows={5}
                                        value={formData.tabDescription}
                                        onChange={e => setFormData({ ...formData, tabDescription: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none resize-none bg-white"
                                        placeholder="Detailed description and specifications for the product..."
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
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8">
                        <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3 md:py-4 border-2 border-zinc-200 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:border-black transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-3 md:py-4 bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (product ? 'Update Product' : 'Add Product')}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
