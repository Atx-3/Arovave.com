import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Simple test page to debug Supabase product fetching
export function TestProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<any>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            console.log('🧪 TEST: Starting Supabase fetch...');
            console.log('🧪 TEST: Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

            try {
                setLoading(true);
                setError(null);

                const { data, error: supabaseError } = await supabase
                    .from('products')
                    .select('*')
                    .order('id');

                console.log('🧪 TEST: Supabase response:', { data, error: supabaseError });
                setRawData({ data, error: supabaseError });

                if (supabaseError) {
                    console.error('🧪 TEST: Supabase error:', supabaseError);
                    setError(`Supabase Error: ${supabaseError.message}`);
                    setLoading(false);
                    return;
                }

                if (!data) {
                    setError('No data returned from Supabase');
                    setLoading(false);
                    return;
                }

                console.log('🧪 TEST: Got', data.length, 'products');
                setProducts(data);
                setLoading(false);

            } catch (err: any) {
                console.error('🧪 TEST: Catch error:', err);
                setError(`Catch Error: ${err.message}`);
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                🧪 Supabase Product Test Page
            </h1>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Error:</strong> {error || 'None'}</p>
                <p><strong>Products Count:</strong> {products.length}</p>
            </div>

            {loading && (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    ⏳ Loading products from Supabase...
                </div>
            )}

            {error && (
                <div style={{ padding: '20px', backgroundColor: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '20px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {!loading && !error && products.length === 0 && (
                <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', marginBottom: '20px' }}>
                    ⚠️ No products found in database. The products table might be empty.
                </div>
            )}

            {products.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                        ✅ Products Found ({products.length}):
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                        {products.map((product) => (
                            <div key={product.id} style={{
                                padding: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                backgroundColor: '#fff'
                            }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{product.name}</p>
                                <p style={{ fontSize: '12px', color: '#666' }}>ID: {product.id}</p>
                                <p style={{ fontSize: '12px', color: '#666' }}>Category: {product.cat}</p>
                                <p style={{ fontSize: '12px', color: '#666' }}>Price: {product.price_range}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e0e0e0', borderRadius: '8px' }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Raw Supabase Response:</h3>
                <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(rawData, null, 2)}
                </pre>
            </div>
        </div>
    );
}
