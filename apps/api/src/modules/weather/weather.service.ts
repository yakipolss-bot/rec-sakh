import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';

const CONDITIONS = ['clear', 'partly-cloudy', 'cloudy', 'rain', 'storm', 'snow', 'fog'] as const;
const ICONS = ['sun', 'cloud-sun', 'cloud', 'cloud-rain', 'cloud-bolt', 'cloud-snow', 'smog'] as const;
const WIND_DIRS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'] as const;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface CurrentWeatherRow {
  cityCode: string;
  temp: number;
  feelsLike: number | null;
  condition: string;
  humidity: number | null;
  windSpeed: number | null;
  windDir: string | null;
  pressure: number | null;
  sunrise: string | null;
  sunset: string | null;
  icon: string | null;
}

interface ForecastRow {
  cityCode: string;
  date: Date;
  tempDay: number;
  tempNight: number;
  condition: string;
  humidity: number | null;
  windSpeed: number | null;
  windDir: string | null;
  pressure: number | null;
  icon: string | null;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<
    {
      city: string;
      cityCode: string;
      temp: number;
      feelsLike: number;
      condition: string;
      humidity: number;
      windSpeed: number;
      windDirection: string;
      pressure: number;
      sunrise: string;
      sunset: string;
      icon: string;
    }[]
  > {
    await this.ensureSeedData();

    const cities = await this.prisma.weatherCity.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    const currentList = await this.prisma.weatherCurrent.findMany();

    return cities.map((city) => {
      const current = currentList.find((c) => c.cityCode === city.cityCode);
      return {
        city: city.nameRu,
        cityCode: city.cityCode,
        temp: Number(current?.temp ?? 0),
        feelsLike: Number(current?.feelsLike ?? 0),
        condition: current?.condition ?? 'unknown',
        humidity: current?.humidity ?? 0,
        windSpeed: Number(current?.windSpeed ?? 0),
        windDirection: current?.windDir ?? '',
        pressure: current?.pressure ?? 0,
        sunrise: current?.sunrise ?? '--:--',
        sunset: current?.sunset ?? '--:--',
        icon: current?.icon ?? 'cloud',
      };
    });
  }

  async findByCityCode(cityCode: string) {
    await this.ensureSeedData();

    const city = await this.prisma.weatherCity.findUnique({
      where: { cityCode },
    });
    if (!city) {
      throw new NotFoundException(`Город с кодом "${cityCode}" не найден`);
    }

    const current = await this.prisma.weatherCurrent.findUnique({
      where: { cityCode },
    });

    const forecasts = await this.prisma.weatherForecast.findMany({
      where: { cityCode },
      orderBy: { date: 'asc' },
      take: 10,
    });

    return {
      city: city.nameRu,
      cityCode: city.cityCode,
      temp: Number(current?.temp ?? 0),
      feelsLike: Number(current?.feelsLike ?? 0),
      condition: current?.condition ?? 'unknown',
      humidity: current?.humidity ?? 0,
      windSpeed: Number(current?.windSpeed ?? 0),
      windDirection: current?.windDir ?? '',
      pressure: current?.pressure ?? 0,
      sunrise: current?.sunrise ?? '--:--',
      sunset: current?.sunset ?? '--:--',
      icon: current?.icon ?? 'cloud',
      forecast: forecasts.map((f) => ({
        date: f.date.toISOString().split('T')[0],
        temp_day: Number(f.tempDay),
        temp_night: Number(f.tempNight),
        condition: f.condition,
        humidity: f.humidity ?? 0,
        windSpeed: Number(f.windSpeed ?? 0),
        icon: f.icon ?? 'cloud',
      })),
    };
  }

  async getForecast(cityCode: string) {
    await this.ensureSeedData();

    const city = await this.prisma.weatherCity.findUnique({
      where: { cityCode },
    });
    if (!city) {
      throw new NotFoundException(`Город с кодом "${cityCode}" не найден`);
    }

    const forecasts = await this.prisma.weatherForecast.findMany({
      where: { cityCode },
      orderBy: { date: 'asc' },
      take: 10,
    });

    return {
      city: city.nameRu,
      cityCode: city.cityCode,
      forecast: forecasts.map((f) => ({
        date: f.date.toISOString().split('T')[0],
        temp_day: Number(f.tempDay),
        temp_night: Number(f.tempNight),
        condition: f.condition,
        humidity: f.humidity ?? 0,
        windSpeed: Number(f.windSpeed ?? 0),
        icon: f.icon ?? 'cloud',
      })),
    };
  }

  async getAlerts() {
    const alerts = await this.prisma.weatherAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return alerts.map((a) => ({
      id: a.id,
      city: a.city,
      alertType: a.alertType,
      severity: a.severity,
      title: a.title,
      description: a.description,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
    }));
  }

  async getCities() {
    const cities = await this.prisma.weatherCity.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });
    return cities.map((c) => ({
      cityCode: c.cityCode,
      name: c.nameRu,
      region: c.region,
      priority: c.priority,
    }));
  }

  // --- Admin methods ---

  async createAlert(dto: {
    city: string;
    alertType: string;
    severity: string;
    title: string;
    description?: string;
    startsAt: string;
    endsAt: string;
  }) {
    const alert = await this.prisma.weatherAlert.create({
      data: {
        city: dto.city,
        alertType: dto.alertType,
        severity: dto.severity,
        title: dto.title,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
    });
    this.logger.log(`Alert created: ${alert.id}`);
    return alert;
  }

  async deleteAlert(id: string) {
    await this.prisma.weatherAlert.delete({ where: { id } });
    this.logger.log(`Alert deleted: ${id}`);
  }

  // --- External API Integration ---

  @Cron('0 */30 * * * *')
  async fetchWeatherFromAPI() {
    this.logger.log('[Weather] Starting scheduled weather fetch...');

    // Try OpenWeatherMap first, then Yandex, then fallback to mock
    let success = false;
    if (process.env['OPENWEATHER_API_KEY']) {
      success = await this.fetchFromOpenWeatherMap();
    }
    if (!success && process.env['YANDEX_WEATHER_KEY']) {
      success = await this.fetchFromYandexWeather();
    }
    if (!success) {
      this.logger.warn('[Weather] No external API keys found or all failed. Generating mock data.');
      await this.generateMockData();
    }
  }

  private async fetchFromOpenWeatherMap(): Promise<boolean> {
    const apiKey = process.env['OPENWEATHER_API_KEY']!;
    try {
      const cities = await this.prisma.weatherCity.findMany({
        where: { isActive: true },
      });

      for (const city of cities) {
        // Fetch current weather by coordinates
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.latitude}&lon=${city.longitude}&appid=${apiKey}&units=metric&lang=ru`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json() as any;

        const condition = this.mapOwmCondition(data.weather?.[0]?.id ?? 800);
        const icon = data.weather?.[0]?.icon ?? '01d';

        await this.prisma.weatherCurrent.upsert({
          where: { cityCode: city.cityCode },
          update: {
            temp: data.main?.temp ?? 0,
            feelsLike: data.main?.feels_like ?? 0,
            condition,
            humidity: data.main?.humidity ?? null,
            windSpeed: data.wind?.speed ?? null,
            windDir: this.degToDir(data.wind?.deg),
            pressure: data.main?.pressure ?? null,
            sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null,
            sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null,
            icon,
          },
          create: {
            cityCode: city.cityCode,
            temp: data.main?.temp ?? 0,
            feelsLike: data.main?.feels_like ?? 0,
            condition,
            humidity: data.main?.humidity ?? null,
            windSpeed: data.wind?.speed ?? null,
            windDir: this.degToDir(data.wind?.deg),
            pressure: data.main?.pressure ?? null,
            sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null,
            sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : null,
            icon,
          },
        });

        // Fetch 5-day / 3-hour forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${city.latitude}&lon=${city.longitude}&appid=${apiKey}&units=metric&lang=ru`;
        const forecastRes = await fetch(forecastUrl);
        if (forecastRes.ok) {
          const forecastData = await forecastRes.json() as any;
          await this.processOwmForecast(city.cityCode, forecastData.list ?? []);
        }
      }

      this.logger.log('[Weather] OpenWeatherMap sync completed');
      return true;
    } catch (err) {
      this.logger.error(`[Weather] OpenWeatherMap error: ${(err as Error).message}`);
      return false;
    }
  }

  private async fetchFromYandexWeather(): Promise<boolean> {
    const apiKey = process.env['YANDEX_WEATHER_KEY']!;
    try {
      const cities = await this.prisma.weatherCity.findMany({
        where: { isActive: true },
      });

      for (const city of cities) {
        const url = `https://api.weather.yandex.ru/v2/forecast?lat=${city.latitude}&lon=${city.longitude}&limit=7`;
        const res = await fetch(url, {
          headers: { 'X-Yandex-API-Key': apiKey },
        });
        if (!res.ok) continue;
        const data = await res.json() as any;

        // Current weather from fact
        const fact = data.fact ?? {};
        const condition = this.mapYandexCondition(fact.condition);
        const icon = fact.icon ?? 'ovc';

        await this.prisma.weatherCurrent.upsert({
          where: { cityCode: city.cityCode },
          update: {
            temp: fact.temp ?? 0,
            feelsLike: fact.feels_like ?? 0,
            condition,
            humidity: fact.humidity ?? null,
            windSpeed: fact.wind_speed ?? null,
            windDir: fact.wind_dir ? this.yandexDirToRu(fact.wind_dir) : null,
            pressure: fact.pressure_mm ?? null,
            sunrise: data.forecasts?.[0]?.sunrise ?? null,
            sunset: data.forecasts?.[0]?.sunset ?? null,
            icon,
          },
          create: {
            cityCode: city.cityCode,
            temp: fact.temp ?? 0,
            feelsLike: fact.feels_like ?? 0,
            condition,
            humidity: fact.humidity ?? null,
            windSpeed: fact.wind_speed ?? null,
            windDir: fact.wind_dir ? this.yandexDirToRu(fact.wind_dir) : null,
            pressure: fact.pressure_mm ?? null,
            sunrise: data.forecasts?.[0]?.sunrise ?? null,
            sunset: data.forecasts?.[0]?.sunset ?? null,
            icon,
          },
        });

        // Forecasts
        const forecasts = data.forecasts ?? [];
        for (const day of forecasts) {
          const date = new Date(day.date + 'T00:00:00Z');
          const dayData = day.parts?.day ?? {};
          const nightData = day.parts?.night ?? {};
          await this.prisma.weatherForecast.upsert({
            where: { cityCode_date: { cityCode: city.cityCode, date } },
            update: {
              tempDay: dayData.temp ?? 0,
              tempNight: nightData.temp ?? 0,
              condition: this.mapYandexCondition(dayData.condition ?? nightData.condition),
              humidity: dayData.humidity ?? null,
              windSpeed: dayData.wind_speed ?? null,
              windDir: dayData.wind_dir ? this.yandexDirToRu(dayData.wind_dir) : null,
              pressure: dayData.pressure_mm ?? null,
              icon: dayData.icon ?? 'ovc',
            },
            create: {
              cityCode: city.cityCode,
              date,
              tempDay: dayData.temp ?? 0,
              tempNight: nightData.temp ?? 0,
              condition: this.mapYandexCondition(dayData.condition ?? nightData.condition),
              humidity: dayData.humidity ?? null,
              windSpeed: dayData.wind_speed ?? null,
              windDir: dayData.wind_dir ? this.yandexDirToRu(dayData.wind_dir) : null,
              pressure: dayData.pressure_mm ?? null,
              icon: dayData.icon ?? 'ovc',
            },
          });
        }
      }

      this.logger.log('[Weather] Yandex Weather sync completed');
      return true;
    } catch (err) {
      this.logger.error(`[Weather] Yandex Weather error: ${(err as Error).message}`);
      return false;
    }
  }

  private async processOwmForecast(cityCode: string, list: any[]) {
    // Group by date (dt_txt has format "2026-05-17 12:00:00")
    const byDate = new Map<string, any[]>();
    for (const item of list) {
      const dateStr = item.dt_txt?.split(' ')[0];
      if (!dateStr) continue;
      if (!byDate.has(dateStr)) byDate.set(dateStr, []);
      byDate.get(dateStr)!.push(item);
    }

    for (const [dateStr, items] of byDate) {
      const date = new Date(dateStr + 'T00:00:00Z');
      const temps = items.map((i: any) => i.main?.temp ?? 0);
      const tempDay = Math.max(...temps);
      const tempNight = Math.min(...temps);
      const mid = items[Math.floor(items.length / 2)] ?? items[0];

      const condition = this.mapOwmCondition(mid.weather?.[0]?.id ?? 800);

      await this.prisma.weatherForecast.upsert({
        where: { cityCode_date: { cityCode, date } },
        update: {
          tempDay,
          tempNight,
          condition,
          humidity: mid.main?.humidity ?? null,
          windSpeed: mid.wind?.speed ?? null,
          windDir: this.degToDir(mid.wind?.deg),
          pressure: mid.main?.pressure ?? null,
          icon: mid.weather?.[0]?.icon ?? '01d',
        },
        create: {
          cityCode,
          date,
          tempDay,
          tempNight,
          condition,
          humidity: mid.main?.humidity ?? null,
          windSpeed: mid.wind?.speed ?? null,
          windDir: this.degToDir(mid.wind?.deg),
          pressure: mid.main?.pressure ?? null,
          icon: mid.weather?.[0]?.icon ?? '01d',
        },
      });
    }
  }

  private mapOwmCondition(weatherId: number): string {
    if (weatherId >= 200 && weatherId < 300) return 'storm';
    if (weatherId >= 300 && weatherId < 400) return 'rain';
    if (weatherId >= 500 && weatherId < 600) return 'rain';
    if (weatherId >= 600 && weatherId < 700) return 'snow';
    if (weatherId >= 700 && weatherId < 800) return 'fog';
    if (weatherId === 800) return 'clear';
    if (weatherId === 801) return 'partly-cloudy';
    return 'cloudy';
  }

  private mapYandexCondition(cond?: string): string {
    const map: Record<string, string> = {
      clear: 'clear',
      partly_cloudy: 'partly-cloudy',
      cloudy: 'cloudy',
      overcast: 'cloudy',
      drizzle: 'rain',
      light_rain: 'rain',
      rain: 'rain',
      heavy_rain: 'storm',
      continuous_heavy_rain: 'storm',
      showers: 'storm',
      wet_snow: 'snow',
      light_snow: 'snow',
      snow: 'snow',
      'snow showers': 'snow',
      hail: 'storm',
      thunderstorm: 'storm',
      thunderstorm_with_rain: 'storm',
      thunderstorm_with_hail: 'storm',
      fog: 'fog',
    };
    return map[cond ?? ''] || 'cloudy';
  }

  private yandexDirToRu(dir: string): string {
    const map: Record<string, string> = {
      nw: 'СЗ', n: 'С', ne: 'СВ',
      w: 'З', e: 'В',
      sw: 'ЮЗ', s: 'Ю', se: 'ЮВ',
    };
    return map[dir.toLowerCase()] ?? dir;
  }

  private degToDir(deg: number): string {
    if (deg == null) return '';
    const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    return dirs[Math.round(deg / 45) % 8];
  }

  // --- Mock data generation (fallback) ---

  private async generateMockData(): Promise<void> {
    this.logger.log('[Weather] Generating mock weather data...');
    const cities = await this.prisma.weatherCity.findMany({
      where: { isActive: true },
    });

    for (const city of cities) {
      const cond = pickRandom(CONDITIONS);
      await this.prisma.weatherCurrent.upsert({
        where: { cityCode: city.cityCode },
        update: {
          temp: randomInt(3, 12),
          feelsLike: randomInt(0, 9),
          condition: cond,
          humidity: randomInt(60, 95),
          windSpeed: randomInt(5, 25),
          windDir: pickRandom(WIND_DIRS),
          pressure: randomInt(740, 770),
          sunrise: '05:34',
          sunset: '21:12',
          icon: ICONS[CONDITIONS.indexOf(cond)],
        },
        create: {
          cityCode: city.cityCode,
          temp: randomInt(3, 12),
          feelsLike: randomInt(0, 9),
          condition: cond,
          humidity: randomInt(60, 95),
          windSpeed: randomInt(5, 25),
          windDir: pickRandom(WIND_DIRS),
          pressure: randomInt(740, 770),
          sunrise: '05:34',
          sunset: '21:12',
          icon: ICONS[CONDITIONS.indexOf(cond)],
        },
      });

      // Generate 10-day forecast
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        const baseTemp = randomInt(2, 12);
        const fcCond = pickRandom(CONDITIONS);
        await this.prisma.weatherForecast.upsert({
          where: { cityCode_date: { cityCode: city.cityCode, date } },
          update: {
            tempDay: baseTemp + randomInt(-1, 3),
            tempNight: baseTemp - randomInt(4, 8),
            condition: fcCond,
            humidity: randomInt(60, 95),
            windSpeed: randomInt(5, 25),
            windDir: pickRandom(WIND_DIRS),
            icon: ICONS[CONDITIONS.indexOf(fcCond)],
          },
          create: {
            cityCode: city.cityCode,
            date,
            tempDay: baseTemp + randomInt(-1, 3),
            tempNight: baseTemp - randomInt(4, 8),
            condition: fcCond,
            humidity: randomInt(60, 95),
            windSpeed: randomInt(5, 25),
            windDir: pickRandom(WIND_DIRS),
            icon: ICONS[CONDITIONS.indexOf(fcCond)],
          },
        });
      }
    }
    this.logger.log('[Weather] Mock data generation complete');
  }

  // --- Seed data if DB empty ---

  private async ensureSeedData(): Promise<void> {
    const count = await this.prisma.weatherCity.count();
    if (count > 0) return;

    this.logger.log('[Weather] Seeding weather cities...');

    const cities = [
      { cityCode: 'yuzhno', name: 'Yuzhno-Sakhalinsk', nameRu: 'Южно-Сахалинск', latitude: 46.9592, longitude: 142.738, region: 'Сахалинская область', priority: 1 },
      { cityCode: 'korsakov', name: 'Korsakov', nameRu: 'Корсаков', latitude: 46.6343, longitude: 142.7774, region: 'Сахалинская область', priority: 2 },
      { cityCode: 'kholmsk', name: 'Kholmsk', nameRu: 'Холмск', latitude: 47.0485, longitude: 142.0481, region: 'Сахалинская область', priority: 3 },
      { cityCode: 'okha', name: 'Okha', nameRu: 'Оха', latitude: 53.5739, longitude: 142.9477, region: 'Сахалинская область', priority: 4 },
      { cityCode: 'nevelsk', name: 'Nevelsk', nameRu: 'Невельск', latitude: 46.6746, longitude: 141.8605, region: 'Сахалинская область', priority: 5 },
      { cityCode: 'poronaysk', name: 'Poronaysk', nameRu: 'Поронайск', latitude: 49.2212, longitude: 143.1069, region: 'Сахалинская область', priority: 6 },
      { cityCode: 'aleksandrovsk', name: 'Aleksandrovsk-Sakhalinsky', nameRu: 'Александровск-Сахалинский', latitude: 50.8999, longitude: 142.1629, region: 'Сахалинская область', priority: 7 },
      { cityCode: 'dolinsk', name: 'Dolinsk', nameRu: 'Долинск', latitude: 47.3269, longitude: 142.8032, region: 'Сахалинская область', priority: 8 },
      { cityCode: 'aniva', name: 'Aniva', nameRu: 'Анива', latitude: 46.7156, longitude: 142.5300, region: 'Сахалинская область', priority: 9 },
      { cityCode: 'kurilsk', name: 'Kurilsk', nameRu: 'Курильск', latitude: 45.2272, longitude: 147.8789, region: 'Курильские острова', priority: 10 },
      { cityCode: 'severokurilsk', name: 'Severo-Kurilsk', nameRu: 'Северо-Курильск', latitude: 50.6786, longitude: 156.1242, region: 'Курильские острова', priority: 11 },
      { cityCode: 'yuzhnokurilsk', name: 'Yuzhno-Kurilsk', nameRu: 'Южно-Курильск', latitude: 44.0305, longitude: 145.8580, region: 'Курильские острова', priority: 12 },
    ];

    for (const city of cities) {
      await this.prisma.weatherCity.create({ data: city });
    }

    this.logger.log(`[Weather] Seeded ${cities.length} cities`);
  }
}
