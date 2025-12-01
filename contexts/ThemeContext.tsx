import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'default' | 'christmas' | 'diwali' | 'holi' | 'eid' | 'mothers-day' | 'fathers-day';

interface ThemeContextType {
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>('default');

    useEffect(() => {
        const savedTheme = localStorage.getItem('giftology_theme') as Theme;
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        }
    }, []);

    const setTheme = (theme: Theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('giftology_theme', theme);
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
