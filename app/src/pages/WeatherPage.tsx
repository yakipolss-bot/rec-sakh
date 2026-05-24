import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, Snowflake, Wind, Droplets, Gauge, AlertTriangle, ArrowLeft, MapPin, Loader2, Umbrella } from 'lucide-react';
import weatherService from '@/services/weather.service';
import type { WeatherData, ForecastDay } from '@/types';
import SEOHead from '@/components/SEOHead';

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

export default function WeatherPage() {
  const [allWeather, setAllWeather] = useState<WeatherData[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await weatherService.getAll();
      if (mounted) {
        setAllWeather(data);
        if (data.length > 0) setSelectedIndex(0);
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (selectedIndex === null) return;
    const city = allWeather[selectedIndex];
    if (!city) return;
    let mounted = true;
    const loadForecast = async () => {
      const data = await weatherService.getForecast(city.cityCode);
      if (mounted) setForecast(data);
    };
    loadForecast();
    return () => { mounted = false; };
  }, [selectedIndex, allWeather]);

  const currentWeather = selectedIndex !== null ? allWeather[selectedIndex] : null;
  const stormWarnings = currentWeather?.condition === 'storm';

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Погода | Сахалин" description="Прогноз погоды в Южно-Сахалинске и Сахалинской области." />
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
          {allWeather.map((w, i) => (
            <button
              key={w.cityCode}
              onClick={() => setSelectedIndex(i)}
              className={selectedIndex === i ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
            >
              <MapPin size={12} className="inline mr-1" />
              {w.city}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
          </div>
        ) : currentWeather ? (
          <>
            {stormWarnings && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sakh-card sakh-card--urgent p-4 mb-6 flex items-start gap-3"
              >
                <AlertTriangle size={20} className="text-[var(--accent-sunset)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[var(--accent-sunset)] mb-1">Штормовое предупреждение</h3>
                  <p className="sakh-meta">Ветер усилится до {currentWeather.windSpeed} м/с. Будьте осторожны.</p>
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
                      <div className="sakh-meta text-[var(--text-primary)] font-medium">{currentWeather.pressure} мм</div>
                      <div className="sakh-caption mt-0.5">Давление</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 text-center">
                      <Umbrella size={16} className="mx-auto mb-1 text-[var(--text-muted)]" />
                      <div className="sakh-meta text-[var(--text-primary)] font-medium">{forecast[0]?.precipitation ?? 0} мм</div>
                      <div className="sakh-caption mt-0.5">Осадки</div>
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
                  <h3 className="sakh-caption mb-4">Осадки, ветер, температура</h3>
                  <div className="overflow-hidden border border-[var(--border-color)]" style={{ aspectRatio: '4/3' }}>
                    <iframe
                      src="https://embed.windy.com/embed2.html?lat=49.0&lon=143.0&zoom=7&level=surface&overlay=rain&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      title="Windy — погода на Сахалине"
                      loading="lazy"
                      allow="fullscreen"
                    />
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
                {forecast.length > 0 ? forecast.map((day, i) => (
                  <div
                    key={i}
                    className="sakh-card p-4 flex flex-col items-center min-w-[100px] text-center shrink-0"
                  >
                    <span className="sakh-caption mb-2">{day.day}</span>
                    <div className="mb-2" style={{ color: conditionColors[day.condition] }}>
                      {weatherIcons[day.condition]}
                    </div>
                    <span className="text-lg font-mono font-medium text-[var(--text-primary)]">
                      {day.tempMax > 0 ? `+${day.tempMax}` : day.tempMax}°
                    </span>
                    <span className="sakh-meta text-xs">
                      {day.tempMin > 0 ? `+${day.tempMin}` : day.tempMin}°
                    </span>
                    <span className="sakh-caption mt-1">{weatherLabels[day.condition]}</span>
                    <span className="sakh-meta text-xs mt-1">
                      {day.precipitation} мм · {day.windSpeed} м/с
                    </span>
                  </div>
                )) : (
                  <p className="sakh-caption py-4">Загрузка прогноза...</p>
                )}
              </div>
            </motion.div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="sakh-caption" style={{ color: 'var(--text-secondary)' }}>Нет данных о погоде</p>
          </div>
        )}
      </div>
    </div>
  );
}
