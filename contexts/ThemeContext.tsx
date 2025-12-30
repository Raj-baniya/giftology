import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

type Theme = 'default' | 'sparkling' | 'christmas' | 'diwali' | 'holi' | 'eid' | 'mothers-day' | 'fathers-day';

interface ThemeContextType {
    currentTheme: Theme;
    setTheme: (theme: Theme) => Promise<{ success: boolean; error?: any }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Initialize from LocalStorage (for instant load and offline support)
    const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
        const cached = localStorage.getItem('giftology_theme');
        return (cached as Theme) || 'christmas'; // Default fallback
    });

    // Ref to track the timestamp of the last LOCAL manual update.
    // We use this to ignore "stale" updates coming from the DB/Realtime for a few seconds
    // to prevent the UI from flickering back to the old theme.
    const lastLocalUpdate = useRef<number>(0);

    useEffect(() => {
        // Helper: safe local update that respects the "ignore window"
        const safelyUpdateTheme = (newTheme: string, source: 'storage' | 'db' | 'realtime') => {
            // If it's a cross-tab storage event, we ALWAYS trust it because it means another tab changed it intentionally.
            if (source === 'storage') {
                console.log(`🔄 [Theme] Storage sync: ${newTheme}`);
                setCurrentTheme(newTheme as Theme);
                // We also update the timestamp so we don't let a lagging DB poll overwrite this valid sync
                lastLocalUpdate.current = Date.now();
                return;
            }

            // For DB/Realtime, we check the time window
            const timeSinceLastLocalChange = Date.now() - lastLocalUpdate.current;
            if (timeSinceLastLocalChange < 5000) {
                console.log(`🛡️ [Theme] Ignoring ${source} update (${newTheme}) - Local change was recent (${timeSinceLastLocalChange}ms ago)`);
                return;
            }

            if (newTheme !== currentTheme) {
                console.log(`📥 [Theme] ${source} update applied: ${newTheme}`);
                setCurrentTheme(newTheme as Theme);
                // Update local storage so we stick to this new truth
                localStorage.setItem('giftology_theme', newTheme);
            }
        };

        // 1. Cross-Tab Sync (LocalStorage Event)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'giftology_theme' && e.newValue) {
                safelyUpdateTheme(e.newValue, 'storage');
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // 2. Fetch from DB (Source of Truth)
        const fetchTheme = async () => {
            try {
                const { data } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'current_theme')
                    .single();

                if (data?.value) {
                    safelyUpdateTheme(data.value, 'db');
                }
            } catch (err) {
                // Determine if we should log based on environment, for now silent to keep console clean
            }
        };
        // Initial fetch
        fetchTheme();

        // 3. Realtime Subscription
        const channel = supabase
            .channel('public:settings')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'settings' },
                (payload: any) => {
                    if (payload.new && payload.new.key === 'current_theme') {
                        safelyUpdateTheme(payload.new.value, 'realtime');
                    }
                }
            )
            .subscribe();

        // 4. Polling Fallback (Every 3 seconds)
        const intervalId = setInterval(fetchTheme, 3000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            supabase.removeChannel(channel);
            clearInterval(intervalId);
        };
    }, [currentTheme]);

    const setTheme = async (theme: Theme): Promise<{ success: boolean; error?: any }> => {
        console.log('🎨 [Theme] Manually setting to:', theme);

        // 1. UPDATE LOCAL STATE IMMEDIATELY & LOCK REMOTE UPDATES through REF
        setCurrentTheme(theme);
        localStorage.setItem('giftology_theme', theme);
        lastLocalUpdate.current = Date.now();

        // Dispatch storage event so other tabs know immediately
        window.dispatchEvent(new Event('storage'));

        // 2. Persist to DB
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    key: 'current_theme',
                    value: theme
                }, { onConflict: 'key' });

            if (error) {
                console.error('❌ [Theme] DB Update failed:', error);
                return { success: false, error };
            }
            console.log('✅ [Theme] DB Saved');
            return { success: true };
        } catch (error) {
            console.error('❌ [Theme] DB Error:', error);
            // We return success: true because the UI update *did* happen
            return { success: true, error };
        }
    };

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
