/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ThemeMode } from '@/types';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  effectiveTheme: Exclude<ThemeMode, 'auto'>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function getEffectiveTheme(mode: ThemeMode): Exclude<ThemeMode, 'auto'> {
  if (mode !== 'auto') return mode;
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 18) return 'day';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('auto');
  const effectiveTheme = getEffectiveTheme(theme);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rec-sakh-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'auto' || stored === 'morning' || stored === 'day' || stored === 'evening' || stored === 'night') {
        setTimeout(() => setThemeState(stored), 0);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('rec-sakh-theme', newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
