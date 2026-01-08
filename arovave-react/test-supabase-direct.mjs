/**
 * Test Supabase Direct - Minimal Query
 * Run with: node test-supabase-direct.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://axkgdbudjmasqwleydah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a2dkYnVkam1hc3F3bGV5ZGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MjYzNjksImV4cCI6MjA4MjMwMjM2OX0.VYlAXaR5nV0ToeG9J5ICVduTNlYtZ-IFWZBK_sm4WPg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Testing Supabase connection speed...\n');

// Test 1: Super minimal query - just count
console.log('Test 1: Count products only');
let start = Date.now();
const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
console.log(`  Time: ${Date.now() - start}ms`);
console.log(`  Count: ${count}`);
console.log(`  Error: ${countError?.message || 'None'}\n`);

// Test 2: Minimal columns - just id and name
console.log('Test 2: Just id and name');
start = Date.now();
const { data: minData, error: minError } = await supabase
    .from('products')
    .select('id, name')
    .limit(10);
console.log(`  Time: ${Date.now() - start}ms`);
console.log(`  Products: ${minData?.length || 0}`);
console.log(`  Error: ${minError?.message || 'None'}\n`);

// Test 3: Essential display columns
console.log('Test 3: Display columns (no images/heavy data)');
start = Date.now();
const { data: displayData, error: displayError } = await supabase
    .from('products')
    .select('id, name, cat, subcategory, price_range, is_trending');
console.log(`  Time: ${Date.now() - start}ms`);
console.log(`  Products: ${displayData?.length || 0}`);
console.log(`  Error: ${displayError?.message || 'None'}\n`);

// Test 4: With thumbnail only
console.log('Test 4: With thumbnail');
start = Date.now();
const { data: thumbData, error: thumbError } = await supabase
    .from('products')
    .select('id, name, cat, thumbnail, price_range, is_trending');
console.log(`  Time: ${Date.now() - start}ms`);
console.log(`  Products: ${thumbData?.length || 0}`);
console.log(`  Error: ${thumbError?.message || 'None'}\n`);

// Test 5: Full query (current)
console.log('Test 5: Full current query');
start = Date.now();
const { data: fullData, error: fullError } = await supabase
    .from('products')
    .select('id, name, cat, subcategory, hsn, moq, price_range, description, certifications, images, video, thumbnail, specs, key_specs, is_trending, created_at')
    .order('created_at', { ascending: false });
console.log(`  Time: ${Date.now() - start}ms`);
console.log(`  Products: ${fullData?.length || 0}`);
console.log(`  Error: ${fullError?.message || 'None'}\n`);

// Test quality_uploads for comparison
console.log('Test 6: Quality uploads (for comparison)');
start = Date.now();
const { data: qualityData, error: qualityError } = await supabase
    .from('quality_uploads')
    .select('*');
console.log(`  Time: ${Date.now() - start}ms`);
console.log(`  Items: ${qualityData?.length || 0}`);
console.log(`  Error: ${qualityError?.message || 'None'}\n`);

console.log('Done!');
