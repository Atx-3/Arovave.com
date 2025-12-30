import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Product, Enquiry } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface EnquiryContextType {
    cart: Product[];
    allEnquiries: Enquiry[];
    isLoadingEnquiries: boolean;
    addToCart: (product: Product) => boolean;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    submitEnquiry: () => Promise<void>;
    submitGeneralEnquiry: () => Promise<void>;
    submitProductEnquiry: (product: Product) => Promise<void>;
    updateEnquiryStatus: (id: number, status: Enquiry['status']) => Promise<void>;
    refreshEnquiries: () => Promise<void>;
}

const EnquiryContext = createContext<EnquiryContextType | undefined>(undefined);

export function EnquiryProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<Product[]>([]);
    const [allEnquiries, setAllEnquiries] = useState<Enquiry[]>([]);
    const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
    const { currentUser, supabaseUser, isAdmin, isSuperAdmin, isAuthenticated } = useAuth();

    // Get user ID - use supabaseUser.id for immediate access
    const getUserId = useCallback(() => {
        return currentUser?.id || supabaseUser?.id;
    }, [currentUser?.id, supabaseUser?.id]);

    // Fetch enquiries from Supabase
    const fetchEnquiries = useCallback(async () => {
        const userId = getUserId();
        if (!userId) {
            console.log('ℹ️ No user ID available for fetching enquiries');
            return;
        }

        setIsLoadingEnquiries(true);
        try {
            let query = supabase
                .from('enquiries')
                .select(`
                    *,
                    profiles:user_id (id, name, email, country, phone)
                `)
                .order('created_at', { ascending: false });

            // Regular users only see their own enquiries
            if (!isAdmin && !isSuperAdmin) {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Error fetching enquiries:', error);
                return;
            }

            console.log('📦 Enquiries loaded:', data?.length || 0);

            // Transform database format to app format
            const enquiries: Enquiry[] = (data || []).map((e: any) => ({
                id: e.id,
                user: e.profiles ? {
                    id: e.profiles.id,
                    name: e.profiles.name || '',
                    email: e.profiles.email || '',
                    country: e.profiles.country || '',
                    phone: e.profiles.phone || '',
                    role: 'user' as const
                } : {
                    id: e.user_id,
                    name: 'Unknown',
                    email: '',
                    country: '',
                    phone: '',
                    role: 'user' as const
                },
                products: e.products || [],
                date: e.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                status: e.status || 'pending'
            }));

            setAllEnquiries(enquiries);
        } catch (err) {
            console.error('❌ Error in fetchEnquiries:', err);
        } finally {
            setIsLoadingEnquiries(false);
        }
    }, [getUserId, isAdmin, isSuperAdmin]);

    // Fetch enquiries when user changes
    useEffect(() => {
        if (isAuthenticated && (currentUser?.id || supabaseUser?.id)) {
            console.log('👤 User available, fetching enquiries...');
            fetchEnquiries();
        } else {
            setAllEnquiries([]);
        }
    }, [isAuthenticated, currentUser?.id, supabaseUser?.id, isAdmin, fetchEnquiries]);

    const refreshEnquiries = useCallback(async () => {
        await fetchEnquiries();
    }, [fetchEnquiries]);

    const addToCart = (product: Product): boolean => {
        if (cart.find(p => p.id === product.id)) {
            return false;
        }
        setCart(prev => [...prev, product]);
        return true;
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(p => p.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    const submitEnquiry = async () => {
        const userId = getUserId();
        if (!userId) {
            console.error('❌ Cannot submit enquiry: No user logged in');
            return;
        }
        if (cart.length === 0) {
            console.error('❌ Cannot submit enquiry: Cart is empty');
            return;
        }

        console.log('📤 Submitting cart enquiry for user:', userId);
        const products = cart.map(p => ({ id: p.id, name: p.name, qty: p.moq }));

        const { error } = await supabase
            .from('enquiries')
            .insert({
                user_id: userId,
                products: products,
                status: 'pending'
            });

        if (error) {
            console.error('❌ Error submitting enquiry:', error);
            return;
        }

        console.log('✅ Enquiry submitted to database');
        clearCart();
        await fetchEnquiries();
    };

    const submitGeneralEnquiry = async () => {
        const userId = getUserId();
        if (!userId) {
            console.error('❌ Cannot submit enquiry: No user logged in');
            return;
        }

        console.log('📤 Submitting general enquiry for user:', userId);
        const products = [{ id: 0, name: 'General Enquiry', qty: 'Consultation request' }];

        const { error } = await supabase
            .from('enquiries')
            .insert({
                user_id: userId,
                products: products,
                status: 'pending'
            });

        if (error) {
            console.error('❌ Error submitting general enquiry:', error);
            return;
        }

        console.log('✅ General enquiry submitted');
        await fetchEnquiries();
    };

    const submitProductEnquiry = async (product: Product) => {
        const userId = getUserId();
        if (!userId) {
            console.error('❌ Cannot submit enquiry: No user logged in');
            return;
        }

        console.log('📤 Submitting product enquiry for user:', userId, 'Product:', product.name);
        const products = [{ id: product.id, name: product.name, qty: product.moq }];

        const { error } = await supabase
            .from('enquiries')
            .insert({
                user_id: userId,
                products: products,
                status: 'pending'
            });

        if (error) {
            console.error('❌ Error submitting product enquiry:', error);
            return;
        }

        console.log('✅ Product enquiry submitted:', product.name);
        await fetchEnquiries();
    };

    const updateEnquiryStatus = async (id: number, status: Enquiry['status']) => {
        const { error } = await supabase
            .from('enquiries')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('❌ Error updating enquiry status:', error);
            return;
        }

        console.log('✅ Enquiry status updated:', id, status);
        await fetchEnquiries();
    };

    return (
        <EnquiryContext.Provider value={{
            cart,
            allEnquiries,
            isLoadingEnquiries,
            addToCart,
            removeFromCart,
            clearCart,
            submitEnquiry,
            submitGeneralEnquiry,
            submitProductEnquiry,
            updateEnquiryStatus,
            refreshEnquiries
        }}>
            {children}
        </EnquiryContext.Provider>
    );
}

export function useEnquiry() {
    const context = useContext(EnquiryContext);
    if (context === undefined) {
        throw new Error('useEnquiry must be used within an EnquiryProvider');
    }
    return context;
}
