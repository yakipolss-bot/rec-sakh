import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useCity } from '@/contexts/CityContext';

export default function CitySelector() {
  const { currentCity, setCity, cities } = useCity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        aria-label="Выбрать город"
      >
        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentCity.name}</span>
        <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-48 z-50 shadow-lg border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            borderRadius: '6px',
            maxHeight: '240px',
            overflowY: 'auto',
          }}
        >
          {cities.map((city) => (
            <button
              key={city.code}
              onClick={() => { setCity(city); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[var(--bg-surface)]"
              style={{
                color: city.code === currentCity.code ? 'var(--accent-ocean)' : 'var(--text-primary)',
                fontWeight: city.code === currentCity.code ? 600 : 400,
              }}
            >
              {city.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
