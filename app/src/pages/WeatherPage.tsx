import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, Snowflake, Wind, Droplets, Gauge, Sunrise, Sunset, AlertTriangle, ArrowLeft, MapPin } from 'lucide-react';
import { weatherData } from '@/data/mock';
import type { WeatherData } from '@/types';

const ALL_CITIES = [
  'Южно-Сахалинск', 'Корсаков', 'Холмск', 'Оха', 'Невельск',
  'Анива', 'Долинск', 'Макаров', 'Поронайск', 'Углегорск',
  'Александровск-Сахалинский', 'Томари', 'Курильск',
];

const weatherIcons: Record<WeatherData['condition'], React.ReactNode> = {
  sunny: <Sun size={32} />,
  cloudy: <Cloud size={32} />,
  rain: <CloudRain size={32} />,
  snow: <Snowflake size={32} />,
  storm: <Wind size={32} />,
  fog: <Cloud size={32} />,
};

const weatherLabels: Record<WeatherData['condition'], string> = {
  sunny: 'Ясно',
  cloudy: 'Облачно',
  rain: 'Дождь',
  snow: 'Снег',
  storm: 'Шторм',
  fog: 'Туман',
};

const conditionColors: Record<WeatherData['condition'], string> = {
  sunny: 'var(--accent-sunset)',
  cloudy: 'var(--text-muted)',
  rain: 'var(--accent-ocean)',
  snow: '#93C5FD',
  storm: 'var(--accent-sunset)',
  fog: 'var(--text-secondary)',
};

const FORECAST_DAYS = [
  { day: 'Пн', temp: 9, condition: 'cloudy' as const },
  { day: 'Вт', temp: 11, condition: 'sunny' as const },
  { day: 'Ср', temp: 8, condition: 'rain' as const },
  { day: 'Чт', temp: 7, condition: 'rain' as const },
  { day: 'Пт', temp: 10, condition: 'cloudy' as const },
  { day: 'Сб', temp: 12, condition: 'sunny' as const },
  { day: 'Вс', temp: 13, condition: 'sunny' as const },
  { day: 'Пн', temp: 11, condition: 'cloudy' as const },
  { day: 'Вт', temp: 9, condition: 'rain' as const },
  { day: 'Ср', temp: 8, condition: 'cloudy' as const },
];

export default function WeatherPage() {
  const [selectedCity, setSelectedCity] = useState(0);
  const currentWeather = weatherData[selectedCity] || weatherData[0];

  const stormWarnings = selectedCity === 2;

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Погода</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Погода на Сахалине</h1>
          <p className="sakh-body">Прогноз по городам острова</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-6">
          {ALL_CITIES.map((city, i) => (
            <button
              key={city}
              onClick={() => setSelectedCity(i)}
              className={selectedCity === i ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
            >
              <MapPin size={12} className="inline mr-1" />
              {city}
            </button>
          ))}
        </div>

        {stormWarnings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sakh-card sakh-card--urgent p-4 mb-6 flex items-start gap-3"
          >
            <AlertTriangle size={20} className="text-[var(--accent-sunset)] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-[var(--accent-sunset)] mb-1">Штормовое предупреждение</h3>
              <p className="sakh-meta">Ветер усилится до 25 м/с, порывы до 30 м/с. Будьте осторожны.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <motion.div
              key={currentWeather.cityCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="sakh-card p-6"
            >
              <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="sakh-title mb-1">{currentWeather.city}</h2>
                  <p className="sakh-caption">Сейчас</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-mono font-bold text-[var(--text-primary)]">
                    {currentWeather.temp > 0 ? `+${currentWeather.temp}` : currentWeather.temp}°
                  </div>
                  <div className="sakh-meta">Ощущается как {currentWeather.feelsLike > 0 ? `+${currentWeather.feelsLike}` : currentWeather.feelsLike}°</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div style={{ color: conditionColors[currentWeather.condition] }}>
                  {weatherIcons[currentWeather.condition]}
                </div>
                <span className="text-lg font-medium text-[var(--text-primary)]">
                  {weatherLabels[currentWeather.condition]}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-primary)] p-3 text-center">
                  <Wind size={16} className="mx-auto mb-1 text-[var(--text-muted)]" />
                  <div className="sakh-meta text-[var(--text-primary)] font-medium">{currentWeather.windSpeed} м/с</div>
                  <div className="sakh-caption mt-0.5">Ветер {currentWeather.windDirection}</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-3 text-center">
                  <Droplets size={16} className="mx-auto mb-1 text-[var(--text-muted)]" />
                  <div className="sakh-meta text-[var(--text-primary)] font-medium">{currentWeather.humidity}%</div>
                  <div className="sakh-caption mt-0.5">Влажность</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-3 text-center">
                  <Gauge size={16} className="mx-auto mb-1 text-[var(--text-muted)]" />
                  <div className="sakh-meta text-[var(--text-primary)] font-medium">{currentWeather.pressure}</div>
                  <div className="sakh-caption mt-0.5">Давление</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-3 text-center">
                  <Sun size={16} className="mx-auto mb-1 text-[var(--text-muted)]" />
                  <div className="sakh-meta text-[var(--text-primary)] font-medium">3</div>
                  <div className="sakh-caption mt-0.5">УФ-индекс</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[var(--bg-primary)] p-3 flex items-center gap-2">
                  <Sunrise size={16} className="text-[var(--accent-sunset)]" />
                  <div>
                    <div className="sakh-meta text-[var(--text-primary)]">05:42</div>
                    <div className="sakh-caption">Восход</div>
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)] p-3 flex items-center gap-2">
                  <Sunset size={16} className="text-[var(--accent-sunset)]" />
                  <div>
                    <div className="sakh-meta text-[var(--text-primary)]">21:15</div>
                    <div className="sakh-caption">Закат</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="sakh-card p-4"
            >
              <h3 className="sakh-caption mb-4">Радар осадков</h3>
              <div className="bg-[var(--bg-primary)] aspect-square flex items-center justify-center border border-[var(--border-color)]">
                <div className="text-center">
                  <Cloud size={40} className="mx-auto mb-2 text-[var(--text-muted)]" />
                  <span className="sakh-caption">Радар</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="sakh-heading mb-4">Прогноз на 10 дней</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
            {FORECAST_DAYS.map((day, i) => (
              <div
                key={i}
                className="sakh-card p-4 flex flex-col items-center min-w-[100px] text-center shrink-0"
              >
                <span className="sakh-caption mb-2">{day.day}</span>
                <div className="mb-2" style={{ color: conditionColors[day.condition] }}>
                  {weatherIcons[day.condition]}
                </div>
                <span className="text-lg font-mono font-medium text-[var(--text-primary)]">
                  {day.temp > 0 ? `+${day.temp}` : day.temp}°
                </span>
                <span className="sakh-caption mt-1">{weatherLabels[day.condition]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
