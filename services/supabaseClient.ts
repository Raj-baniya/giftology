import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== SUPABASE INITIALIZATION ===');
console.log('URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('Key:', supabaseAnonKey ? 'SET' : 'MISSING');

let supabaseInstance;

try {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Supabase credentials missing!');
        console.log('VITE_SUPABASE_URL:', supabaseUrl);
        console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING');
        throw new Error('Supabase credentials not configured');
    }

    console.log('✅ Creating Supabase client...');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        global: {
            headers: {
                'x-application-name': 'giftology'
            }
        }
    });
    console.log('✅ Supabase client created successfully');
} catch (error) {
    console.error('❌ Failed to initialize Supabase:', error);
    // Do NOT throw here, or the app will crash at startup (blank screen)
    // Instead, allow the app to load so the user sees the ErrorBoundary or handled UI
    supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder');
}

export const supabase = supabaseInstance;

// Timeout wrapper to prevent hanging queries
const QUERY_TIMEOUT = 5000; // 5 seconds

export async function queryWithTimeout<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    defaultValue: T,
    queryName: string = 'Unknown Query'
): Promise<{ data: T; error: any }> {
    console.log(`🔵 Starting query: ${queryName}`);

    try {
        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Query timeout: ${queryName}`)), QUERY_TIMEOUT)
        );

        const result = await Promise.race([queryFn(), timeoutPromise]);

        if (result.error) {
            console.error(`❌ Query error (${queryName}):`, result.error);
            return { data: defaultValue, error: result.error };
        }

        console.log(`✅ Query success (${queryName})`);
        return { data: result.data || defaultValue, error: null };
    } catch (err: any) {
        console.error(`❌ Query failed/timeout (${queryName}):`, err.message);
        return { data: defaultValue, error: err };
    }
}
