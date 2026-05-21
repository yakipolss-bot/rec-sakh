/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (newsId: string) => void;
  isFavorite: (newsId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rec-sakh-favorites');
      if (stored) setTimeout(() => setFavorites(JSON.parse(stored)), 0);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    localStorage.setItem('rec-sakh-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((newsId: string) => {
    setFavorites(prev => {
      const next = prev.includes(newsId)
        ? prev.filter(id => id !== newsId)
        : [...prev, newsId];
      return next;
    });
  }, []);

  const isFavorite = useCallback((newsId: string) => favorites.includes(newsId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
