import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(__dirname, '.env');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env file:', e);
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes
        env[key] = value;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    console.log('Found keys:', Object.keys(env));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying database content...');
    console.log('Supabase URL:', supabaseUrl);

    // 1. Check Categories
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*');

    if (catError) console.error('Error fetching categories:', catError);
    else console.log(`Categories found: ${categories.length}`);

    // 4. Check Subcategories
    const { data: subcategories, error: subError } = await supabase
        .from('subcategories')
        .select('*')
        .limit(1);

    if (subError) {
        console.error('Error fetching subcategories:', subError.message);
    } else {
        console.log(`Subcategories found: ${subcategories.length}`);
    }

    // 2. Check Products and is_active status
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, is_active');

    if (prodError) {
        console.error('Error fetching products:', prodError);
    } else {
        console.log(`Products found: ${products.length}`);
        const activeCount = products.filter(p => p.is_active === true).length;
        const inactiveCount = products.filter(p => !p.is_active).length;
        console.log(`- Active: ${activeCount}`);
        console.log(`- Inactive/Null: ${inactiveCount}`);

        if (products.length > 0 && activeCount === 0) {
            console.warn('WARNING: All products are inactive! The RLS policy "is_active = true" will hide them all.');
        }
    }

    // 3. Check Play Videos
    // Note: User's SQL created 'play_videos', but did they run it? let's check.
    const { data: videos, error: videoError } = await supabase
        .from('play_videos')
        .select('*');

    if (videoError) {
        console.error('Error fetching play_videos:', videoError.message); // might be "relation does not exist"
    } else {
        console.log(`Play Videos found: ${videos.length}`);
    }
}

verify();
