/**
 * Check thumbnail data format
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://axkgdbudjmasqwleydah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a2dkYnVkam1hc3F3bGV5ZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MjYzNjksImV4cCI6MjA4MjMwMjM2OX0.VYlAXaR5nV0ToeG9J5ICVduTNlYtZ-IFWZBK_sm4WPg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get one product with thumbnail
const { data } = await supabase
    .from('products')
    .select('id, name, thumbnail, images')
    .limit(1)
    .single();

console.log('Product:', data?.name);
console.log('Thumbnail length:', data?.thumbnail?.length || 0);
console.log('Thumbnail preview:', data?.thumbnail?.substring(0, 100) + '...');
console.log('Images count:', data?.images?.length || 0);
if (data?.images?.[0]) {
    console.log('First image length:', data.images[0].length);
    console.log('First image preview:', data.images[0].substring(0, 100) + '...');
}
