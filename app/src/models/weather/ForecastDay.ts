import { WeatherData } from './WeatherData';

export interface ForecastDay {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: WeatherData['condition'];
  precipitation: number;
  windSpeed: number;
}
