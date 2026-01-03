// Quick test to check Supabase connection
// Run with: node --experimental-modules test-supabase.mjs

const SUPABASE_URL = 'https://axkgdbudjmasqwleydah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a2dkYnVkam1hc3F3bGV5ZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MjYzNjksImV4cCI6MjA4MjMwMjM2OX0.VYlAXaR5nV0ToeG9J5ICVduTNlYtZ-IFWZBK_sm4WPg';

async function testSupabase() {
    console.log('Testing Supabase connection...');
    console.log('URL:', SUPABASE_URL);

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }

        const data = await response.json();
        console.log('Products found:', data.length);
        console.log('First product:', data[0]);

    } catch (error) {
        console.error('Connection error:', error);
    }
}

testSupabase();
