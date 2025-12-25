import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product, Enquiry } from '../types';
import { useAuth } from './AuthContext';

interface EnquiryContextType {
    cart: Product[];
    allEnquiries: Enquiry[];
    addToCart: (product: Product) => boolean;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    submitEnquiry: () => void;
    submitGeneralEnquiry: () => void;
    submitProductEnquiry: (product: Product) => void;
    updateEnquiryStatus: (id: number, status: Enquiry['status']) => void;
}

const EnquiryContext = createContext<EnquiryContextType | undefined>(undefined);

export function EnquiryProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<Product[]>([]);
    const [allEnquiries, setAllEnquiries] = useState<Enquiry[]>([]);
    const { currentUser } = useAuth();

    // Load enquiries from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('arovaveAllEnquiries');
        if (saved) {
            setAllEnquiries(JSON.parse(saved));
        } else {
            // Mock data for demo
            const mockEnquiries: Enquiry[] = [
                {
                    id: 1,
                    user: { name: 'John Smith', email: 'john@acmecorp.com', country: 'USA' },
                    products: [{ id: 1, name: 'Premium Basmati Rice', qty: '50 MT' }],
                    date: '2024-12-20',
                    status: 'pending'
                },
                {
                    id: 2,
                    user: { name: 'Maria Garcia', email: 'maria@eurofoods.es', country: 'Spain' },
                    products: [{ id: 2, name: 'Paracetamol 500mg', qty: '100,000 units' }],
                    date: '2024-12-18',
                    status: 'contacted'
                },
                {
                    id: 3,
                    user: { name: 'Ahmed Hassan', email: 'ahmed@gulftrading.ae', country: 'UAE' },
                    products: [{ id: 4, name: 'Custom Promotional Items', qty: '10,000 pcs' }],
                    date: '2024-12-15',
                    status: 'completed'
                }
            ];
            setAllEnquiries(mockEnquiries);
        }
    }, []);

    const addToCart = (product: Product): boolean => {
        if (cart.find(p => p.id === product.id)) {
            return false; // Already in cart
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

    const submitEnquiry = () => {
        if (!currentUser || cart.length === 0) return;

        const newEnquiry: Enquiry = {
            id: allEnquiries.length + 1,
            user: currentUser,
            products: cart.map(p => ({ id: p.id, name: p.name })),
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };

        const updated = [...allEnquiries, newEnquiry];
        setAllEnquiries(updated);
        localStorage.setItem('arovaveAllEnquiries', JSON.stringify(updated));
        clearCart();
    };

    const updateEnquiryStatus = (id: number, status: Enquiry['status']) => {
        const updated = allEnquiries.map(e =>
            e.id === id ? { ...e, status } : e
        );
        setAllEnquiries(updated);
        localStorage.setItem('arovaveAllEnquiries', JSON.stringify(updated));
    };

    const submitGeneralEnquiry = () => {
        if (!currentUser) return;

        const newEnquiry: Enquiry = {
            id: allEnquiries.length + 1,
            user: currentUser,
            products: [{ id: 0, name: 'General Enquiry', qty: 'Consultation request' }],
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };

        const updated = [...allEnquiries, newEnquiry];
        setAllEnquiries(updated);
        localStorage.setItem('arovaveAllEnquiries', JSON.stringify(updated));
    };

    const submitProductEnquiry = (product: Product) => {
        if (!currentUser) return;

        const newEnquiry: Enquiry = {
            id: allEnquiries.length + 1,
            user: currentUser,
            products: [{ id: product.id, name: product.name, qty: product.moq }],
            date: new Date().toISOString().split('T')[0],
            status: 'pending'
        };

        const updated = [...allEnquiries, newEnquiry];
        setAllEnquiries(updated);
        localStorage.setItem('arovaveAllEnquiries', JSON.stringify(updated));
    };

    return (
        <EnquiryContext.Provider value={{
            cart,
            allEnquiries,
            addToCart,
            removeFromCart,
            clearCart,
            submitEnquiry,
            submitGeneralEnquiry,
            submitProductEnquiry,
            updateEnquiryStatus
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
