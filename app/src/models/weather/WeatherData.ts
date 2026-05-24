export interface WeatherData {
  city: string;
  cityCode: string;
  temp: number;
  feelsLike: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';
  humidity: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
}
