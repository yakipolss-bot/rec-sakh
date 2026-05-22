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
