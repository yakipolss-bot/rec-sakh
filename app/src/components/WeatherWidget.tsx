import { useState } from 'react';
import { Cloud, CloudRain, Snowflake, Sun, Wind, Droplets, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { weatherData } from '@/data/mock';
import type { WeatherData } from '@/types';

const weatherIcons: Record<WeatherData['condition'], React.ReactNode> = {
  sunny: <Sun size={28} />,
  cloudy: <Cloud size={28} />,
  rain: <CloudRain size={28} />,
  snow: <Snowflake size={28} />,
  storm: <Wind size={28} />,
  fog: <Cloud size={28} />,
};

const weatherLabels: Record<WeatherData['condition'], string> = {
  sunny: 'Ясно',
  cloudy: 'Облачно',
  rain: 'Дождь',
  snow: 'Снег',
  storm: 'Шторм',
  fog: 'Туман',
};

export default function WeatherWidget() {
  const [selectedCity, setSelectedCity] = useState(0);
  const weather = weatherData[selectedCity];

  return (
    <div className="sakh-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="sakh-caption">
          Погода
        </h3>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(Number(e.target.value))}
          className="sakh-select"
          style={{ width: 'auto', fontSize: 'var(--text-xs)', padding: '2px 24px 2px 8px', backgroundPosition: 'right 4px center' }}
        >
          {weatherData.map((w, i) => (
            <option key={w.cityCode} value={i}>{w.city}</option>
          ))}
        </select>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={weather.cityCode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div style={{ color: 'var(--accent-ocean)' }}>
              {weatherIcons[weather.condition]}
            </div>
            <div>
              <div className="text-3xl font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                {weather.temp > 0 ? `+${weather.temp}` : weather.temp}°
              </div>
              <div className="sakh-meta">{weatherLabels[weather.condition]}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <Wind size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="sakh-meta mt-1" style={{ color: 'var(--text-primary)' }}>
                {weather.windSpeed} м/с
              </span>
            </div>
            <div className="flex flex-col items-center p-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <Droplets size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="sakh-meta mt-1" style={{ color: 'var(--text-primary)' }}>
                {weather.humidity}%
              </span>
            </div>
            <div className="flex flex-col items-center p-2" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <Gauge size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="sakh-meta mt-1" style={{ color: 'var(--text-primary)' }}>
                {weather.pressure}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
