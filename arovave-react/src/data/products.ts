import type { Product } from '../types';

// Products are now loaded from Supabase database only
// This empty array serves as fallback when Supabase is unavailable
export const products: Product[] = [];


export const categories = [
    {
        id: 'food',
        name: 'Processed Food',
        icon: 'utensils',
        subcategories: [
            { id: 'coffee', name: 'Coffee' },
            { id: 'honey', name: 'Honey' },
            { id: 'spices', name: 'Spices' },
            { id: 'rice', name: 'Rice & Grains' },
            { id: 'tea', name: 'Tea' },
            { id: 'oil', name: 'Edible Oils' },
            { id: 'snacks', name: 'Snacks & Namkeen' },
            { id: 'pickles', name: 'Pickles & Chutneys' }
        ]
    },
    {
        id: 'pharma',
        name: 'Generic Medicines',
        icon: 'pill',
        subcategories: [
            { id: 'non-opioid', name: 'Non-Opioid Analgesics' },
            { id: 'opioid', name: 'Opioid Analgesics' },
            { id: 'topical', name: 'Topical Medicines' },
            { id: 'steroids', name: 'Steroids (short-term use)' },
            { id: 'adjuvant', name: 'Adjuvant Medicines' }
        ]
    },
    {
        id: 'glass',
        name: 'Glass Bottles',
        icon: 'flask-conical',
        subcategories: [
            { id: 'amber', name: 'Amber Bottles' },
            { id: 'clear', name: 'Clear Bottles' },
            { id: 'dropper', name: 'Dropper Bottles' },
            { id: 'vials', name: 'Vials' },
            { id: 'jars', name: 'Glass Jars' }
        ]
    },
    {
        id: 'promo',
        name: 'Promotional Items',
        icon: 'gift',
        subcategories: [
            { id: 'bags', name: 'Bags & Pouches' },
            { id: 'apparel', name: 'Apparel & Caps' },
            { id: 'stationery', name: 'Stationery' },
            { id: 'drinkware', name: 'Drinkware' },
            { id: 'tech', name: 'Tech Accessories' }
        ]
    }
];
