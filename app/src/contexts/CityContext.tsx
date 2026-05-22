import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface City {
  name: string;
  code: string;
  lat: number;
  lon: number;
}

const CITIES: City[] = [
  { name: 'Южно-Сахалинск', code: 'yuzhno', lat: 46.959, lon: 142.738 },
  { name: 'Корсаков', code: 'korsakov', lat: 46.632, lon: 142.790 },
  { name: 'Холмск', code: 'kholmsk', lat: 47.043, lon: 142.045 },
  { name: 'Оха', code: 'okha', lat: 53.589, lon: 142.946 },
  { name: 'Невельск', code: 'nevelsk', lat: 46.673, lon: 141.860 },
  { name: 'Поронайск', code: 'poronaysk', lat: 49.221, lon: 143.116 },
  { name: 'Долинск', code: 'dolinsk', lat: 47.324, lon: 142.797 },
  { name: 'Александровск-Сахалинский', code: 'aleksandrovsk', lat: 50.897, lon: 142.169 },
  { name: 'Анива', code: 'aniva', lat: 46.713, lon: 142.527 },
  { name: 'Макаров', code: 'makarov', lat: 48.625, lon: 142.780 },
  { name: 'Томари', code: 'tomari', lat: 47.764, lon: 142.067 },
  { name: 'Углегорск', code: 'uglegorsk', lat: 49.063, lon: 142.033 },
  { name: 'Ноглики', code: 'nogliki', lat: 51.789, lon: 143.142 },
];

const DEFAULT_CITY = CITIES[0];

function findNearestCity(lat: number, lon: number): City {
  let nearest = DEFAULT_CITY;
  let minDist = Infinity;
  for (const c of CITIES) {
    const d = Math.sqrt((c.lat - lat) ** 2 + (c.lon - lon) ** 2);
    if (d < minDist) { minDist = d; nearest = c; }
  }
  return nearest;
}

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

  const setCity = (city: City) => setCurrentCity(city);

  return (
    <CityContext.Provider value={{ currentCity, setCity, cities: CITIES }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}
