import { createContext, useState, useEffect, type ReactNode } from 'react';
import { findNearestCity, SAKHALIN_CITIES, type City } from '@/lib/cities';

const DEFAULT_CITY = SAKHALIN_CITIES[0];

interface CityContextValue {
  currentCity: City;
  setCity: (city: City) => void;
  cities: City[];
}

const CityContext = createContext<CityContextValue | null>(null);

export { CityContext };

export function CityProvider({ children }: { children: ReactNode }) {
  const [currentCity, setCurrentCity] = useState<City>(() => {
    try {
      if (typeof window === 'undefined') return DEFAULT_CITY;
      const saved = localStorage.getItem('sakh_city');
      if (saved) return JSON.parse(saved) as City;
    } catch { }
    return DEFAULT_CITY;
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    if (localStorage.getItem('sakh_geo_done')) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCity(findNearestCity(pos.coords.latitude, pos.coords.longitude));
        localStorage.setItem('sakh_geo_done', '1');
      },
      () => { localStorage.setItem('sakh_geo_done', '1'); },
      { timeout: 5000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => {
    try { localStorage.setItem('sakh_city', JSON.stringify(currentCity)); } catch { }
  }, [currentCity]);

  return (
    <CityContext.Provider value={{ currentCity, setCity: setCurrentCity, cities: SAKHALIN_CITIES }}>
      {children}
    </CityContext.Provider>
  );
}
