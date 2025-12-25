import type { Product } from '../types';

export const products: Product[] = [
    {
        id: 1,
        name: 'Premium Basmati Rice',
        cat: 'food',
        images: [
            'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800',
            'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=800',
            'https://images.unsplash.com/photo-1594020293008-5f99f60bd4e4?w=800'
        ],
        video: 'https://www.w3schools.com/html/mov_bbb.mp4',
        description: 'Grade A Basmati Rice sourced directly from the premium paddy fields of Punjab. Aged for 24 months for perfect aroma and elongation. Ideal for biryani, pulao, and fine dining applications.',
        specs: [
            { label: 'Origin', value: 'Punjab, India' },
            { label: 'Grain Length', value: '8.3mm+' },
            { label: 'Aging', value: '24 Months' },
            { label: 'Moisture', value: '12.5% Max' },
            { label: 'Broken Grains', value: '1% Max' },
            { label: 'Packaging', value: '25kg / 50kg Bags' }
        ],
        moq: '20 MT',
        priceRange: '$850 - $1,200 / MT',
        hsn: '1006.30',
        certifications: ['FSSAI', 'ISO 9001', 'APEDA'],
        isTrending: true
    },
    {
        id: 2,
        name: 'Paracetamol 500mg',
        cat: 'pharma',
        images: [
            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
            'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800'
        ],
        description: 'WHO-GMP certified Paracetamol tablets manufactured in state-of-the-art facilities. Available in various packaging options for retail and institutional use.',
        specs: [
            { label: 'Strength', value: '500mg' },
            { label: 'Form', value: 'Tablets' },
            { label: 'Packaging', value: '10x10 / Bulk' },
            { label: 'Shelf Life', value: '36 Months' }
        ],
        moq: '50,000 Units',
        priceRange: '$0.02 - $0.05 / Unit',
        hsn: '3004.90',
        certifications: ['WHO-GMP', 'ISO 9001', 'FDA Approved'],
        isTrending: true
    },
    {
        id: 3,
        name: 'Amber Glass Bottles',
        cat: 'glass',
        images: [
            'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800',
            'https://images.unsplash.com/photo-1595925889916-8b0e1bbece1d?w=800'
        ],
        description: 'Premium amber glass bottles for pharmaceutical, cosmetic, and beverage applications. UV protection ensures product integrity.',
        specs: [
            { label: 'Material', value: 'Type III Soda Lime' },
            { label: 'Color', value: 'Amber' },
            { label: 'Capacity', value: '30ml - 1000ml' },
            { label: 'Finish', value: 'PP28 / ROPP' }
        ],
        moq: '10,000 Pcs',
        priceRange: '$0.15 - $0.85 / Pc',
        hsn: '7010.90',
        certifications: ['ISO 9001', 'FDA', 'USP Type III']
    },
    {
        id: 4,
        name: 'Custom Promotional Items',
        cat: 'promo',
        images: [
            'https://images.unsplash.com/photo-1503602642458-232111445657?w=800',
            'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800'
        ],
        description: 'Full range of customizable promotional merchandise including bags, t-shirts, mugs, and more. Perfect for corporate gifting and brand promotion.',
        specs: [
            { label: 'Products', value: 'Bags, Apparel, Mugs, Pens' },
            { label: 'Customization', value: 'Logo Print / Embroidery' },
            { label: 'Lead Time', value: '15-20 Days' }
        ],
        moq: '500 Pcs',
        priceRange: '$2 - $25 / Pc',
        hsn: '4202.92',
        certifications: ['ISO 9001', 'SEDEX']
    }
];

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
