import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TransportSyncService } from './transport-sync.service.js';

const SEED_FLIGHTS = [
  {
    flightNumber: 'SU6284', airline: 'Аэрофлот',
    departureCity: 'Москва (SVO)', arrivalCity: 'Южно-Сахалинск (UUS)',
    departureTime: new Date('2026-05-16T08:30:00+03:00'), arrivalTime: new Date('2026-05-16T22:30:00+11:00'),
    status: 'on-time', terminal: 'B', gate: '12', date: new Date('2026-05-16'),
  },
  {
    flightNumber: 'S76254', airline: 'S7 Airlines',
    departureCity: 'Новосибирск (OVB)', arrivalCity: 'Южно-Сахалинск (UUS)',
    departureTime: new Date('2026-05-16T12:00:00+07:00'), arrivalTime: new Date('2026-05-16T22:00:00+11:00'),
    status: 'delayed', terminal: 'A', gate: '5', date: new Date('2026-05-16'),
  },
  {
    flightNumber: 'SU6285', airline: 'Аэрофлот',
    departureCity: 'Южно-Сахалинск (UUS)', arrivalCity: 'Москва (SVO)',
    departureTime: new Date('2026-05-16T23:30:00+11:00'), arrivalTime: new Date('2026-05-17T05:30:00+03:00'),
    status: 'on-time', terminal: 'A', gate: '3', date: new Date('2026-05-16'),
  },
  {
    flightNumber: 'HZ2456', airline: 'Аврора',
    departureCity: 'Хабаровск (KHV)', arrivalCity: 'Южно-Сахалинск (UUS)',
    departureTime: new Date('2026-05-16T14:00:00+10:00'), arrivalTime: new Date('2026-05-16T16:30:00+11:00'),
    status: 'on-time', terminal: 'B', gate: '7', date: new Date('2026-05-16'),
  },
  {
    flightNumber: 'HZ2567', airline: 'Аврора',
    departureCity: 'Южно-Сахалинск (UUS)', arrivalCity: 'Владивосток (VVO)',
    departureTime: new Date('2026-05-16T06:00:00+11:00'), arrivalTime: new Date('2026-05-16T07:30:00+10:00'),
    status: 'cancelled', terminal: 'A', gate: '1', date: new Date('2026-05-16'),
  },
  {
    flightNumber: 'SU6286', airline: 'Аэрофлот',
    departureCity: 'Южно-Сахалинск (UUS)', arrivalCity: 'Москва (SVO)',
    departureTime: new Date('2026-05-17T10:30:00+11:00'), arrivalTime: new Date('2026-05-17T16:30:00+03:00'),
    status: 'on-time', terminal: 'A', gate: '3', date: new Date('2026-05-17'),
  },
  {
    flightNumber: 'HZ2457', airline: 'Аврора',
    departureCity: 'Южно-Сахалинск (UUS)', arrivalCity: 'Хабаровск (KHV)',
    departureTime: new Date('2026-05-17T07:00:00+11:00'), arrivalTime: new Date('2026-05-17T08:30:00+10:00'),
    status: 'scheduled', terminal: 'A', gate: '2', date: new Date('2026-05-17'),
  },
  {
    flightNumber: 'HZ2568', airline: 'Аврора',
    departureCity: 'Владивосток (VVO)', arrivalCity: 'Южно-Сахалинск (UUS)',
    departureTime: new Date('2026-05-17T15:00:00+10:00'), arrivalTime: new Date('2026-05-17T18:00:00+11:00'),
    status: 'scheduled', terminal: 'B', gate: '7', date: new Date('2026-05-17'),
  },
  {
    flightNumber: 'SU6282', airline: 'Аэрофлот',
    departureCity: 'Москва (SVO)', arrivalCity: 'Южно-Сахалинск (UUS)',
    departureTime: new Date('2026-05-17T12:30:00+03:00'), arrivalTime: new Date('2026-05-18T02:30:00+11:00'),
    status: 'scheduled', terminal: 'B', gate: '14', date: new Date('2026-05-17'),
  },
  {
    flightNumber: 'S76255', airline: 'S7 Airlines',
    departureCity: 'Новосибирск (OVB)', arrivalCity: 'Южно-Сахалинск (UUS)',
    departureTime: new Date('2026-05-17T06:00:00+07:00'), arrivalTime: new Date('2026-05-17T16:00:00+11:00'),
    status: 'scheduled', terminal: 'A', gate: '5', date: new Date('2026-05-17'),
  },
];

const SEED_FERRIES = [
  {
    route: 'Ванино-Холмск', vesselName: 'Сахалин-8',
    departurePort: 'Ванино', arrivalPort: 'Холмск',
    departureTime: new Date('2026-05-16T08:00:00+10:00'), arrivalTime: new Date('2026-05-16T20:00:00+11:00'),
    status: 'scheduled', date: new Date('2026-05-16'),
  },
  {
    route: 'Ванино-Холмск', vesselName: 'Сахалин-9',
    departurePort: 'Холмск', arrivalPort: 'Ванино',
    departureTime: new Date('2026-05-16T10:00:00+11:00'), arrivalTime: new Date('2026-05-16T22:00:00+10:00'),
    status: 'scheduled', date: new Date('2026-05-16'),
  },
  {
    route: 'Ванино-Холмск', vesselName: 'Сахалин-10',
    departurePort: 'Ванино', arrivalPort: 'Холмск',
    departureTime: new Date('2026-05-16T14:00:00+10:00'), arrivalTime: new Date('2026-05-17T06:00:00+11:00'),
    status: 'delayed', date: new Date('2026-05-16'),
  },
  {
    route: 'Корсаков — Вакканай', vesselName: 'Эйнс Соя',
    departurePort: 'Корсаков', arrivalPort: 'Вакканай',
    departureTime: new Date('2026-05-18T09:00:00+11:00'), arrivalTime: new Date('2026-05-18T17:00:00+09:00'),
    status: 'scheduled', date: new Date('2026-05-18'),
  },
  {
    route: 'Южно-Курильск — Кунашир', vesselName: 'Курильский пролив',
    departurePort: 'Южно-Курильск', arrivalPort: 'Кунашир',
    departureTime: new Date('2026-05-17T06:00:00+11:00'), arrivalTime: new Date('2026-05-17T09:00:00+11:00'),
    status: 'scheduled', date: new Date('2026-05-17'),
  },
];

const SEED_ROADS = [
  {
    roadName: 'А-393', section: 'Южно-Сахалинск — Корсаков, 0–40 км',
    status: 'open', conditionDescription: 'Состояние удовлетворительное. Местами ямы после зимы.',
  },
  {
    roadName: 'А-392', section: 'Южно-Сахалинск — Холмск, 0–85 км',
    status: 'open', conditionDescription: 'Дорога открыта. На 45-м км ремонтные работы, реверсивное движение.',
  },
  {
    roadName: 'Р-486', section: 'Южно-Сахалинск — Оха, 150–200 км',
    status: 'caution', conditionDescription: 'Гололёд на подъёмах. Рекомендуется зимняя резина.',
  },
  {
    roadName: 'А-393', section: 'Корсаков — Невельск, 40–80 км',
    status: 'closed', conditionDescription: 'Участок перекрыт из-за последствий циклона. Ориентировочное открытие — 18:00.',
  },
  {
    roadName: 'М-1', section: 'Объездная Южно-Сахалинска',
    status: 'open', conditionDescription: 'Состояние хорошее. Движение свободное.',
  },
  {
    roadName: 'А-391', section: 'Южно-Сахалинск — Долинск, 0–45 км',
    status: 'open', conditionDescription: 'Трасса в хорошем состоянии. Ремонтные работы не ведутся.',
  },
  {
    roadName: 'Р-487', section: 'Оха — Ноглики, 0–100 км',
    status: 'caution', conditionDescription: 'Участок с гравийным покрытием. Рекомендуется сниженная скорость.',
  },
  {
    roadName: 'А-394', section: 'Южно-Сахалинск — Анива, 0–30 км',
    status: 'open', conditionDescription: 'Асфальт в хорошем состоянии. Дорожная разметка обновлена.',
  },
];

const SEED_SCHEDULES = [
  {
    type: 'bus', routeName: '1', city: 'Южно-Сахалинск',
    stops: ['Ж/д вокзал', 'пл. Ленина', 'ул. Украинская', 'Горбольница'],
    schedule: { weekday: '05:30–23:00', weekend: '06:00–22:00', interval: '10–15 мин' },
  },
  {
    type: 'bus', routeName: '4', city: 'Южно-Сахалинск',
    stops: ['м-н Северный', 'пл. Победы', 'ул. Сахалинская', 'Рынок'],
    schedule: { weekday: '06:00–22:00', weekend: '06:30–21:00', interval: '15–20 мин' },
  },
  {
    type: 'bus', routeName: '11', city: 'Южно-Сахалинск',
    stops: ['Аэропорт', 'пл. Ленина', 'Ж/д вокзал', 'м-н Ново-Александровск'],
    schedule: { weekday: '05:00–23:30', weekend: '05:30–23:00', interval: '20 мин' },
  },
  {
    type: 'bus', routeName: '22', city: 'Южно-Сахалинск',
    stops: ['м-н Луговое', 'ул. Ленина', 'ТЦ Мега', 'Ж/д вокзал'],
    schedule: { weekday: '06:00–22:00', weekend: '06:30–21:00', interval: '25 мин' },
  },
  {
    type: 'bus', routeName: '63', city: 'Южно-Сахалинск',
    stops: ['м-н Хомутово', 'ул. Комсомольская', 'пл. Ленина', 'СахГУ'],
    schedule: { weekday: '06:00–21:00', weekend: '07:00–20:00', interval: '30 мин' },
  },
  {
    type: 'train', routeName: 'Южно-Сахалинск — Ноглики', city: 'Южно-Сахалинск',
    stops: ['Южно-Сахалинск', 'Синегорск', 'Поронайск', 'Тымовское', 'Ноглики'],
    schedule: { departure: '07:00', arrival: '19:30', days: 'ежедневно' },
  },
  {
    type: 'train', routeName: 'Южно-Сахалинск — Корсаков', city: 'Южно-Сахалинск',
    stops: ['Южно-Сахалинск', 'Пригородная', 'Корсаков'],
    schedule: { departure: '06:30', arrival: '07:50', days: 'ежедневно' },
  },
  {
    type: 'train', routeName: 'Южно-Сахалинск — Холмск', city: 'Южно-Сахалинск',
    stops: ['Южно-Сахалинск', 'Чапаево', 'Пятиречье', 'Холмск'],
    schedule: { departure: '08:00', arrival: '10:30', days: 'ежедневно' },
  },
  {
    type: 'bus', routeName: '101', city: 'Корсаков',
    stops: ['Автовокзал', 'ул. Октябрьская', 'Рынок', 'Порт'],
    schedule: { weekday: '06:00–21:00', weekend: '07:00–20:00', interval: '20 мин' },
  },
];

@Injectable()
export class TransportService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TransportService.name);

  constructor(
    private prisma: PrismaService,
    private syncService: TransportSyncService,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureSeedData();
  }

  // --- Public Endpoints ---

  async getSchedule(type?: string, city?: string, routeName?: string) {
    await this.ensureSeedData();

    const where: any = {};
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (routeName) where.routeName = { contains: routeName, mode: 'insensitive' };

    const schedules = await this.prisma.transportSchedule.findMany({ where });
    return schedules.map((s) => ({
      id: s.id,
      type: s.type,
      routeName: s.routeName,
      city: s.city,
      stops: s.stops as string[],
      schedule: s.schedule as Record<string, any>,
    }));
  }

  async getFlights(date?: string, type?: string) {
    await this.ensureSeedData();

    const where: any = {};
    if (date) {
      const d = new Date(date);
      where.date = d;
    }
    if (type === 'arrival') where.arrivalCity = { contains: 'UUS' };
    if (type === 'departure') where.departureCity = { contains: 'UUS' };

    const flights = await this.prisma.transportFlight.findMany({
      where,
      orderBy: { departureTime: 'asc' },
    });
    return flights.map((f) => ({
      id: f.id,
      flightNumber: f.flightNumber,
      airline: f.airline,
      departureCity: f.departureCity,
      arrivalCity: f.arrivalCity,
      departureTime: f.departureTime.toISOString(),
      arrivalTime: f.arrivalTime.toISOString(),
      status: f.status,
      terminal: f.terminal,
      gate: f.gate,
      date: f.date.toISOString().split('T')[0],
    }));
  }

  async getFlightById(id: string) {
    await this.ensureSeedData();

    const flight = await this.prisma.transportFlight.findUnique({ where: { id } });
    if (!flight) throw new NotFoundException('Рейс не найден');

    return {
      id: flight.id,
      flightNumber: flight.flightNumber,
      airline: flight.airline,
      departureCity: flight.departureCity,
      arrivalCity: flight.arrivalCity,
      departureTime: flight.departureTime.toISOString(),
      arrivalTime: flight.arrivalTime.toISOString(),
      status: flight.status,
      terminal: flight.terminal,
      gate: flight.gate,
      date: flight.date.toISOString().split('T')[0],
    };
  }

  async getFerries(date?: string, route?: string) {
    await this.ensureSeedData();

    const where: any = {};
    if (date) where.date = new Date(date);
    if (route) where.route = { contains: route, mode: 'insensitive' };

    const ferries = await this.prisma.transportFerry.findMany({
      where,
      orderBy: { departureTime: 'asc' },
    });
    return ferries.map((f) => ({
      id: f.id,
      route: f.route,
      vesselName: f.vesselName,
      departurePort: f.departurePort,
      arrivalPort: f.arrivalPort,
      departureTime: f.departureTime.toISOString(),
      arrivalTime: f.arrivalTime.toISOString(),
      status: f.status,
      date: f.date.toISOString().split('T')[0],
    }));
  }

  async getRoads() {
    await this.ensureSeedData();

    const roads = await this.prisma.transportRoad.findMany({
      orderBy: { roadName: 'asc' },
    });
    return roads.map((r) => ({
      id: r.id,
      roadName: r.roadName,
      section: r.section,
      status: r.status,
      conditionDescription: r.conditionDescription,
      lastUpdated: r.lastUpdated.toISOString(),
    }));
  }

  async getRoadById(id: string) {
    await this.ensureSeedData();

    const road = await this.prisma.transportRoad.findUnique({ where: { id } });
    if (!road) throw new NotFoundException('Участок дороги не найден');

    return {
      id: road.id,
      roadName: road.roadName,
      section: road.section,
      status: road.status,
      conditionDescription: road.conditionDescription,
      lastUpdated: road.lastUpdated.toISOString(),
    };
  }

  // --- Admin Endpoints ---

  async createFlight(dto: {
    flightNumber: string;
    airline?: string;
    departureCity?: string;
    arrivalCity?: string;
    departureTime: string;
    arrivalTime: string;
    status?: string;
    terminal?: string;
    gate?: string;
    date: string;
  }) {
    const flight = await this.prisma.transportFlight.create({
      data: {
        flightNumber: dto.flightNumber,
        airline: dto.airline ?? null,
        departureCity: dto.departureCity ?? null,
        arrivalCity: dto.arrivalCity ?? null,
        departureTime: new Date(dto.departureTime),
        arrivalTime: new Date(dto.arrivalTime),
        status: dto.status ?? 'scheduled',
        terminal: dto.terminal ?? null,
        gate: dto.gate ?? null,
        date: new Date(dto.date),
      },
    });
    return flight;
  }

  async updateFlight(id: string, dto: {
    status?: string;
    terminal?: string;
    gate?: string;
    departureTime?: string;
    arrivalTime?: string;
  }) {
    const flight = await this.prisma.transportFlight.findUnique({ where: { id } });
    if (!flight) throw new NotFoundException('Рейс не найден');

    const data: any = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.terminal !== undefined) data.terminal = dto.terminal;
    if (dto.gate !== undefined) data.gate = dto.gate;
    if (dto.departureTime !== undefined) data.departureTime = new Date(dto.departureTime);
    if (dto.arrivalTime !== undefined) data.arrivalTime = new Date(dto.arrivalTime);

    return this.prisma.transportFlight.update({ where: { id }, data });
  }

  async createFerry(dto: {
    route: string;
    vesselName?: string;
    departurePort?: string;
    arrivalPort?: string;
    departureTime: string;
    arrivalTime: string;
    status?: string;
    date: string;
  }) {
    const ferry = await this.prisma.transportFerry.create({
      data: {
        route: dto.route,
        vesselName: dto.vesselName ?? null,
        departurePort: dto.departurePort ?? null,
        arrivalPort: dto.arrivalPort ?? null,
        departureTime: new Date(dto.departureTime),
        arrivalTime: new Date(dto.arrivalTime),
        status: dto.status ?? 'scheduled',
        date: new Date(dto.date),
      },
    });
    return ferry;
  }

  async updateRoad(id: string, dto: {
    status?: string;
    conditionDescription?: string;
  }) {
    const road = await this.prisma.transportRoad.findUnique({ where: { id } });
    if (!road) throw new NotFoundException('Участок дороги не найден');

    const data: any = { lastUpdated: new Date() };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.conditionDescription !== undefined) data.conditionDescription = dto.conditionDescription;

    return this.prisma.transportRoad.update({ where: { id }, data });
  }

  async createSchedule(dto: {
    type: string;
    routeName: string;
    stops?: string[];
    schedule?: Record<string, any>;
    city?: string;
  }) {
    const schedule = await this.prisma.transportSchedule.create({
      data: {
        type: dto.type,
        routeName: dto.routeName,
        stops: dto.stops ?? [],
        schedule: dto.schedule ?? {},
        city: dto.city ?? null,
      },
    });
    return {
      id: schedule.id,
      type: schedule.type,
      routeName: schedule.routeName,
      city: schedule.city,
      stops: schedule.stops as string[],
      schedule: schedule.schedule as Record<string, any>,
    };
  }

  async seedData() {
    this.logger.log('[Transport] Seeding transport data...');
    await this.seedFlights();
    await this.seedFerries();
    await this.seedRoads();
    await this.seedSchedules();
    this.logger.log('[Transport] Seed complete');
    return { message: 'Transport data seeded successfully' };
  }

  // --- Scheduled Sync (moved to TransportSyncService) ---

  // --- Seed helpers ---

  private async ensureSeedData(): Promise<void> {
    const flightCount = await this.prisma.transportFlight.count();
    if (flightCount > 0) return;

    this.logger.log('[Transport] No data found, seeding...');
    await this.seedFlights();
    await this.seedFerries();
    await this.seedRoads();
    await this.seedSchedules();
  }

  private async seedFlights() {
    for (const f of SEED_FLIGHTS) {
      await this.prisma.transportFlight.create({ data: f });
    }
    this.logger.log(`[Transport] Seeded ${SEED_FLIGHTS.length} flights`);
  }

  private async seedFerries() {
    for (const f of SEED_FERRIES) {
      await this.prisma.transportFerry.create({ data: f });
    }
    this.logger.log(`[Transport] Seeded ${SEED_FERRIES.length} ferries`);
  }

  private async seedRoads() {
    for (const r of SEED_ROADS) {
      await this.prisma.transportRoad.create({ data: r });
    }
    this.logger.log(`[Transport] Seeded ${SEED_ROADS.length} road sections`);
  }

  private async seedSchedules() {
    for (const s of SEED_SCHEDULES) {
      await this.prisma.transportSchedule.create({ data: s });
    }
    this.logger.log(`[Transport] Seeded ${SEED_SCHEDULES.length} schedules`);
  }

  async getSyncStatus() {
    const [flights, ferries, roads, schedules] = await Promise.all([
      this.prisma.transportFlight.count(),
      this.prisma.transportFerry.count(),
      this.prisma.transportRoad.count(),
      this.prisma.transportSchedule.count(),
    ]);

    return {
      flights: { count: flights, lastSync: this.syncService.lastFlightsSync, lastCount: this.syncService.lastFlightsCount },
      ferries: { count: ferries, lastSync: this.syncService.lastFerrySync, lastCount: this.syncService.lastFerryCount },
      roads: { count: roads },
      schedules: { count: schedules },
    };
  }
}
