import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ThemeMode, PlatformSettings } from '../types';

export interface ThemeContextType {
  themeMode: ThemeMode;
  theme: 'light' | 'dark';
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  applyBranding: (branding: Partial<PlatformSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  theme: 'light',
  isDark: false,
  setThemeMode: () => {},
  toggleTheme: () => {},
  applyBranding: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('dsk_theme_mode') as ThemeMode;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'system';
  });

  const getSystemTheme = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return getSystemTheme();
  });

  // Apply Light/Dark class and variables to <html>
  useEffect(() => {
    const updateTheme = () => {
      let activeIsDark = false;
      if (themeMode === 'dark') {
        activeIsDark = true;
      } else if (themeMode === 'light') {
        activeIsDark = false;
      } else {
        activeIsDark = getSystemTheme();
      }

      setIsDark(activeIsDark);
      const root = document.documentElement;

      if (activeIsDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    updateTheme();

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (themeMode === 'system') {
          updateTheme();
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode, getSystemTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('dsk_theme_mode', mode);
    } catch (e) {
      // ignore
    }
  };

  const toggleTheme = () => {
    const nextMode = isDark ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  const applyBranding = (branding: Partial<PlatformSettings>) => {
    const root = document.documentElement;
    if (branding.primaryColor) {
      root.style.setProperty('--brand-primary', branding.primaryColor);
      root.style.setProperty('--primary', branding.primaryColor);
    }
    if (branding.borderRadius) {
      root.style.setProperty('--brand-radius', branding.borderRadius);
    }
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        themeMode, 
        theme: isDark ? 'dark' : 'light', 
        isDark, 
        setThemeMode, 
        toggleTheme, 
        applyBranding 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
