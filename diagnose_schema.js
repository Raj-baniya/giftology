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
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        env[key] = value;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('=== Database Diagnosis ===');

    // 1. Check Tables Existence via direct select (if empty, it's fine, but if error, table missing)
    const tables = ['products', 'categories', 'product_variants', 'reviews', 'play_videos', 'orders'];

    for (const table of tables) {
        process.stdout.write(`Checking ${table}... `);
        const { data, error } = await supabase.from(table).select('id').limit(1);

        if (error) {
            console.log(`❌ ERROR: ${error.message} (Code: ${error.code})`);
            // code 42P01 means undefined_table
            if (error.code === '42P01') {
                console.log(`   -> Table '${table}' DOES NOT EXIST. This breaks queries joining on it.`);
            }
            if (error.code === '42501') {
                console.log(`   -> RLS Permission Denied on '${table}'. User cannot read.`);
            }
        } else {
            console.log('✅ OK (Exists + Accessible)');
        }
    }

    console.log('\n=== Deep Query Test ===');
    // Test the specific query used in Shop page
    console.log('Testing Shop Page Query...');
    const { error: deepError } = await supabase
        .from('products')
        .select('*, categories(name, slug), product_variants(*), reviews(rating, is_approved)')
        .limit(1);

    if (deepError) {
        console.error('❌ Shop Query Failed:', deepError.message);
    } else {
        console.log('✅ Shop Query Success');
    }

    console.log('=== Diagnosis Complete ===');
}

diagnose();
