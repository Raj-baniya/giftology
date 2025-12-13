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
    console.log('Verifying database...');

    // Check product_variants table
    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing product_variants table:', error);
        if (error.code === '42P01') {
            console.error('Table product_variants does not exist!');
        }
    } else {
        console.log('product_variants table exists. Rows:', data.length);
    }

    // Check products table for cost_price
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('cost_price')
        .limit(1);

    if (prodError) {
        console.error('Error accessing products table:', prodError);
    } else {
        console.log('products table accessed successfully.');
        if (products.length > 0 && products[0].cost_price === undefined) {
            console.error('cost_price column might be missing (returned undefined)');
        } else {
            console.log('cost_price column check passed (or no rows to check).');
        }
    }
}

verify();
