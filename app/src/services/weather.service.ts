import { WeatherData } from '../models/weather/WeatherData';
import { ForecastDay } from '../models/weather/ForecastDay';

interface SakhalinCity {
  name: string;
  code: string;
  lat: number;
  lon: number;
}

const SAKHALIN_CITIES: SakhalinCity[] = [
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

function wmoToCondition(code: number): WeatherData['condition'] {
  if (code === 0) return 'sunny';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

function degreesToDirection(deg: number): string {
  const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  return dirs[Math.round(deg / 45) % 8];
}

function hPaToMmHg(hPa: number): number {
  return Math.round(hPa * 0.75006);
}

interface CacheEntry {
  data: WeatherData[];
  forecast: Map<string, ForecastDay[]>;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 10 * 60 * 1000;

class WeatherService {
  async getAll(): Promise<WeatherData[]> {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return cache.data;
    }

    const results: WeatherData[] = [];
    const batchSize = 5;

    for (let i = 0; i < SAKHALIN_CITIES.length; i += batchSize) {
      const batch = SAKHALIN_CITIES.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (city) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=Asia%2FVladivostok`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const json = await res.json();
            const cur = json.current;
            return {
              city: city.name,
              cityCode: city.code,
              temp: Math.round(cur.temperature_2m),
              feelsLike: Math.round(cur.apparent_temperature),
              condition: wmoToCondition(cur.weather_code),
              humidity: cur.relative_humidity_2m,
              windSpeed: Math.round(cur.wind_speed_10m),
              windDirection: degreesToDirection(cur.wind_direction_10m),
              pressure: hPaToMmHg(cur.surface_pressure),
            } as WeatherData;
          } catch {
            return null;
          }
        })
      );
      results.push(...batchResults.filter(Boolean) as WeatherData[]);
    }

    if (results.length === 0 && cache) {
      return cache.data;
    }

    if (results.length > 0) {
      cache = { data: results, forecast: cache?.forecast || new Map(), timestamp: Date.now() };
    }

    return results;
  }

  async getForecast(cityCode: string): Promise<ForecastDay[]> {
    if (cache?.forecast?.has(cityCode) && Date.now() - cache.timestamp < CACHE_TTL) {
      return cache.forecast.get(cityCode)!;
    }

    const city = SAKHALIN_CITIES.find((c) => c.code === cityCode);
    if (!city) return [];

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max&timezone=Asia%2FVladivostok`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const json = await res.json();
      const daily = json.daily;
      const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

      const forecast: ForecastDay[] = daily.time.slice(0, 10).map((dateStr: string, i: number) => {
        const d = new Date(dateStr);
        return {
          day: dayNames[d.getDay()],
          date: dateStr,
          tempMax: Math.round(daily.temperature_2m_max[i]),
          tempMin: Math.round(daily.temperature_2m_min[i]),
          condition: wmoToCondition(daily.weather_code[i]),
          precipitation: daily.precipitation_sum[i],
          windSpeed: Math.round(daily.wind_speed_10m_max[i]),
        };
      });

      if (!cache) {
        const allData = await this.getAll();
        cache = { data: allData, forecast: new Map(), timestamp: Date.now() };
      }
      cache.forecast.set(cityCode, forecast);
      return forecast;
    } catch {
      return [];
    }
  }
}

const weatherService = new WeatherService();
export default weatherService;
export { WeatherService };
