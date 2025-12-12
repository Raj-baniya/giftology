import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getGlobalTheme, updateGlobalTheme } from '../services/supabaseService';

type Theme = 'default' | 'christmas' | 'diwali' | 'holi' | 'eid' | 'mothers-day' | 'fathers-day';

interface ThemeContextType {
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>('christmas');

    useEffect(() => {
        // 1. Fetch initial theme from DB
        const fetchTheme = async () => {
            const theme = await getGlobalTheme();
            setCurrentTheme(theme as Theme);
        };
        fetchTheme();

        // 2. Subscribe to Realtime changes
        const channel = supabase
            .channel('public:settings')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'settings',
                    filter: 'key=eq.current_theme'
                },
                (payload) => {
                    console.log('Theme update received:', payload);
                    if (payload.new && payload.new.value) {
                        setCurrentTheme(payload.new.value as Theme);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const setTheme = async (theme: Theme) => {
        // Optimistic update
        setCurrentTheme(theme);
        try {
            await updateGlobalTheme(theme);
        } catch (error) {
            console.error('Failed to update global theme:', error);
            // Revert on failure (optional, but good practice)
            const savedTheme = await getGlobalTheme();
            setCurrentTheme(savedTheme as Theme);
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
