import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { findNearestCity, SAKHALIN_CITIES, type City } from '@/lib/cities';

const DEFAULT_CITY = SAKHALIN_CITIES[0];

interface CityContextValue {
  currentCity: City;
  setCity: (city: City) => void;
  cities: City[];
}

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: ReactNode }) {
  const [currentCity, setCurrentCity] = useState<City>(() => {
    try {
      const saved = localStorage.getItem('sakh_city');
      if (saved) return JSON.parse(saved) as City;
    } catch { /* ignore */ }
    return DEFAULT_CITY;
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    const key = 'sakh_geo_done';
    if (localStorage.getItem(key)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
        setCurrentCity(nearest);
        localStorage.setItem(key, '1');
      },
      () => { localStorage.setItem(key, '1'); },
      { timeout: 5000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => {
    try { localStorage.setItem('sakh_city', JSON.stringify(currentCity)); } catch { /* ignore */ }
  }, [currentCity]);

  return (
    <CityContext.Provider value={{ currentCity, setCity, cities: SAKHALIN_CITIES }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}
