import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, Inbox, ArrowLeft, Mail, Plus, Edit, Trash2, ImagePlus, Video, X, Award, Utensils, Pill, FlaskConical, Gift } from 'lucide-react';
import { useEnquiry } from '../context';
import { products as initialProducts, categories } from '../data';
import type { Product, Enquiry } from '../types';

// Get products from localStorage or use initial
const getStoredProducts = (): Product[] => {
    const saved = localStorage.getItem('arovaveProducts');
    if (saved) {
        return JSON.parse(saved);
    }
    return [...initialProducts];
};

export function Admin() {
    const [tab, setTab] = useState<'users' | 'products' | 'enquiries' | 'quality'>('users');
    const { allEnquiries, updateEnquiryStatus } = useEnquiry();
    const [products, setProducts] = useState<Product[]>(getStoredProducts);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Quality content state
    const [qualityContent, setQualityContent] = useState<Record<string, any[]>>({});
    const [selectedQualityCategory, setSelectedQualityCategory] = useState<string>('food');

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        // Load quality content
        const saved = localStorage.getItem('arovaveQualityContent');
        if (saved) {
            setQualityContent(JSON.parse(saved));
        }
    }, []);

    const qualityCategories = [
        { id: 'food', name: 'Processed Food', icon: Utensils },
        { id: 'pharma', name: 'Generic Medicines', icon: Pill },
        { id: 'glass', name: 'Glass Bottles', icon: FlaskConical },
        { id: 'promo', name: 'Promotional Items', icon: Gift }
    ];

    // Mock users data
    const users = [
        { name: 'John Smith', email: 'john@acmecorp.com', country: 'USA', phone: '+1 234 567 8900', joined: '2024-12-20' },
        { name: 'Maria Garcia', email: 'maria@eurofoods.es', country: 'Spain', phone: '+34 612 345 678', joined: '2024-12-18' },
        { name: 'Ahmed Hassan', email: 'ahmed@gulftrading.ae', country: 'UAE', phone: '+971 50 123 4567', joined: '2024-12-15' }
    ];

    const statusColors: Record<Enquiry['status'], string> = {
        pending: 'bg-yellow-50 text-yellow-700',
        contacted: 'bg-blue-50 text-blue-700',
        completed: 'bg-green-50 text-green-700',
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

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-zinc-100 flex-wrap">
                <button
                    onClick={() => setTab('users')}
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'users' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                >
                    <Users className="w-4 h-4" /> Users
                </button>
                <button
                    onClick={() => setTab('products')}
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'products' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                >
                    <Package className="w-4 h-4" /> Products
                </button>
                <button
                    onClick={() => setTab('enquiries')}
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'enquiries' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                >
                    <Inbox className="w-4 h-4" /> Enquiries
                </button>
                <button
                    onClick={() => setTab('quality')}
                    className={`pb-4 px-2 text-sm font-black uppercase tracking-widest flex items-center gap-2 ${tab === 'quality' ? 'text-black border-b-2 border-black' : 'text-zinc-400'}`}
                >
                    <Award className="w-4 h-4" /> Quality Content
                </button>
            </div>

            {/* Users Tab */}
            {tab === 'users' && (
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                    <div className="p-6 border-b border-zinc-100">
                        <h3 className="font-black uppercase tracking-widest text-sm">All Registered Users ({users.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50">
                                <tr>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Name</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Email</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Country</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Phone</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, i) => (
                                    <tr key={i} className="border-t border-zinc-50">
                                        <td className="p-4 font-semibold">{user.name}</td>
                                        <td className="p-4 text-zinc-600">{user.email}</td>
                                        <td className="p-4 text-zinc-600">{user.country}</td>
                                        <td className="p-4 text-zinc-600">{user.phone}</td>
                                        <td className="p-4 text-zinc-400 text-sm">{user.joined}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Products Tab */}
            {tab === 'products' && (
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
            {tab === 'enquiries' && (
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
                                                <option value="completed">Completed</option>
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
                    <p className="text-zinc-500 mb-6">Manage certificates, plant photos, and product samples for each category.</p>

                    {/* Category Tabs */}
                    <div className="flex gap-3 mb-8 overflow-x-auto">
                        {qualityCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedQualityCategory(cat.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${selectedQualityCategory === cat.id
                                    ? 'bg-black text-white'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                    }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Add Buttons */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        <button
                            onClick={() => addQualityItem(selectedQualityCategory, 'certificate')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-200 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Certificate
                        </button>
                        <button
                            onClick={() => addQualityItem(selectedQualityCategory, 'plant')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-200 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Plant Photo
                        </button>
                        <button
                            onClick={() => addQualityItem(selectedQualityCategory, 'sample')}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-purple-200 transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Product Sample
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {(qualityContent[selectedQualityCategory] || []).map((item: any) => (
                            <div key={item.id} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden group">
                                <div className="aspect-[4/3] overflow-hidden relative">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => deleteQualityItem(selectedQualityCategory, item.id)}
                                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${item.type === 'certificate' ? 'text-green-600' :
                                        item.type === 'plant' ? 'text-blue-600' : 'text-purple-600'
                                        }`}>
                                        {item.type === 'certificate' ? 'Certificate' :
                                            item.type === 'plant' ? 'Manufacturing Plant' : 'Product Sample'}
                                    </span>
                                    <h4 className="font-bold mt-1">{item.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>

                    {(!qualityContent[selectedQualityCategory] || qualityContent[selectedQualityCategory].length === 0) && (
                        <div className="text-center py-16 bg-zinc-50 rounded-2xl">
                            <p className="text-zinc-400 mb-4">No content added for this category yet.</p>
                            <p className="text-sm text-zinc-400">Use the buttons above to add certificates, plant photos, or product samples.</p>
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
        isTrending: product?.isTrending || false
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images || []);

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
            images: formData.images.length ? formData.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
            video: formData.video || undefined,
            specs: product?.specs || [],
            isTrending: formData.isTrending
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
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Subcategory</label>
                                <select
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
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Certifications (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.certifications}
                                onChange={e => setFormData({ ...formData, certifications: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-zinc-200 rounded-xl font-semibold focus:border-black focus:outline-none"
                                placeholder="ISO 9001, FSSAI, WHO-GMP"
                            />
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
            </div>
        </div>
    );
}
