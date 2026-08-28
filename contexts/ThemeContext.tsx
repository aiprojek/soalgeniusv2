import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            const storedTheme = localStorage.getItem('soalgenius_theme');
            if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
                return storedTheme as Theme;
            }
        } catch (error) {
            console.error('Failed to read theme from localStorage', error);
        }
        return 'system';
    });

    const [systemDark, setSystemDark] = useState<boolean>(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    // Listen to OS color scheme preference changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemDark(e.matches);
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
        } else {
            mediaQuery.addListener(handleChange);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleChange);
            } else {
                mediaQuery.removeListener(handleChange);
            }
        };
    }, []);

    const resolvedTheme: ResolvedTheme = useMemo(() => {
        if (theme === 'system') {
            return systemDark ? 'dark' : 'light';
        }
        return theme;
    }, [theme, systemDark]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(resolvedTheme === 'light' ? 'dark' : 'light');
        root.classList.add(resolvedTheme);
        try {
            localStorage.setItem('soalgenius_theme', theme);
        } catch (error) {
            console.error('Failed to save theme to localStorage', error);
        }
    }, [theme, resolvedTheme]);
    
    const toggleTheme = () => {
        setThemeState(prevTheme => {
            if (prevTheme === 'light') return 'dark';
            if (prevTheme === 'dark') return 'system';
            return 'light';
        });
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const value = useMemo(() => ({ theme, resolvedTheme, toggleTheme, setTheme }), [theme, resolvedTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};