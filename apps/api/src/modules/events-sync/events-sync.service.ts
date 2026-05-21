import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service.js';

const EVENT_CATEGORIES = [
  { name: 'Кино', slug: 'kino' },
  { name: 'Театр', slug: 'teatr' },
  { name: 'Концерты', slug: 'kontserty' },
  { name: 'Выставки', slug: 'vystavki' },
  { name: 'Фестивали', slug: 'festivali' },
  { name: 'Экскурсии', slug: 'ekskursii' },
  { name: 'Спорт', slug: 'sport' },
  { name: 'Мастер-классы', slug: 'master-klassy' },
  { name: 'Обучение', slug: 'obuchenie' },
  { name: 'Детям', slug: 'detyam' },
];

interface ProCultureEvent {
  _id: number;
  name: string;
  description?: string;
  shortDescription?: string;
  categories?: { _id: number; name: string }[];
  locale?: { _id: number; name: string };
  place?: { _id: number; name: string; address?: string };
  schedule?: { start?: number; end?: number }[];
  images?: { name: string }[];
  ageRestricted?: string;
  siteUrl?: string;
  ticketUrl?: string;
  isFree?: boolean;
  price?: string;
}

@Injectable()
export class EventsSyncService implements OnModuleInit {
  private readonly logger = new Logger(EventsSyncService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureEventCategories();
      await this.seedInitialEvents();
    } catch (err) {
      this.logger.warn(`EventsSync init skipped: ${(err as Error).message}`);
    }
  }

  private async ensureEventCategories() {
    for (const cat of EVENT_CATEGORIES) {
      await this.prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, type: 'events' },
        create: { name: cat.name, slug: cat.slug, type: 'events', sortOrder: 0 },
      });
    }
  }

  @Cron('0 3 * * *')
  async autoArchiveExpired() {
    const result = await this.prisma.event.updateMany({
      where: { status: 'published', endDate: { lt: new Date() }, deletedAt: null },
      data: { status: 'archived' },
    });
    if (result.count > 0) {
      this.logger.log(`Archived ${result.count} expired events`);
    }
  }

  @Cron('0 */6 * * *')
  async syncFromProCulture() {
    const apiKey = this.config.get<string>('PRO_CULTURE_API_KEY');
    if (!apiKey) {
      this.logger.warn('PRO_CULTURE_API_KEY not set, skipping sync');
      return;
    }
    try {
      const fetched = await this.fetchFromProCulture(apiKey);
      this.logger.log(`Fetched ${fetched.length} events from PRO.Культура.РФ`);
      await this.upsertEvents(fetched, 'pro-culture');
    } catch (err) {
      this.logger.error('PRO.Культура.РФ sync failed', err);
    }
  }

  private async fetchFromProCulture(apiKey: string): Promise<ProCultureEvent[]> {
    const baseUrl = 'https://pro.culture.ru/api/2.4/events';
    const all: ProCultureEvent[] = [];
    let offset = 0;
    const limit = 100;
    let total = 0;

    do {
      const url = `${baseUrl}?apiKey=${apiKey}&limit=${limit}&offset=${offset}&sort=_id&status=accepted`;
      const res = await fetch(url);
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`PRO.Культура.РФ API ${res.status}: ${errBody}`);
      }
      const json = await res.json();
      const events: ProCultureEvent[] = json.events ?? [];
      total = json.total ?? events.length;
      all.push(...events);
      offset += limit;
    } while (offset < total);

    return all;
  }

  private async upsertEvents(events: ProCultureEvent[], source: string) {
    const catMap = new Map<string, string>();
    for (const slug of EVENT_CATEGORIES.map(c => c.slug)) {
      const cat = await this.prisma.category.findUnique({ where: { slug } });
      if (cat) catMap.set(slug, cat.id);
    }

    let created = 0;
    for (const evt of events) {
      if (!evt.name || !evt.schedule?.length) continue;

      const startMs = evt.schedule[0].start;
      const endMs = evt.schedule[0].end;
      if (!startMs) continue;

      const categoryId = this.matchCategory(evt, catMap);

      const existing = await this.prisma.event.findFirst({
        where: { externalId: String(evt._id), externalSource: source },
      });

      const data = {
        title: evt.name,
        description: evt.description ?? '',
        shortDescription: evt.shortDescription ?? undefined,
        categoryId,
        city: evt.locale?.name ?? undefined,
        venueName: evt.place?.name ?? undefined,
        venueAddress: evt.place?.address ?? undefined,
        startDate: new Date(startMs),
        endDate: endMs ? new Date(endMs) : undefined,
        isFree: evt.isFree ?? false,
        price: evt.price ? parseFloat(evt.price) : undefined,
        imageUrl: evt.images?.length ? `https://all.culture.ru/uploads/${evt.images[0].name}` : undefined,
        ticketUrl: evt.siteUrl ?? evt.ticketUrl ?? undefined,
        status: 'published' as const,
        externalId: String(evt._id),
        externalSource: source,
      };

      if (existing) {
        await this.prisma.event.update({ where: { id: existing.id }, data });
      } else {
        await this.prisma.event.create({ data });
        created++;
      }
    }
    this.logger.log(`Upserted ${events.length} events (${created} new) from ${source}`);
  }

  private matchCategory(evt: ProCultureEvent, catMap: Map<string, string>): string | undefined {
    const slugOrder: [string, string[]][] = [
      ['teatr', ['Театр', 'спектакль', 'балет', 'опера']],
      ['kontserty', ['Концерт', 'оркестр', 'джаз', 'филармония']],
      ['vystavki', ['Выставка', 'экспозиция', 'вернисаж']],
      ['kino', ['Кино', 'фильм', 'кинопоказ']],
      ['festivali', ['Фестиваль']],
      ['ekskursii', ['Экскурсия']],
      ['master-klassy', ['Мастер-класс', 'мастеркласс']],
      ['sport', ['Спорт', 'соревнование', 'турнир']],
      ['detyam', ['Детям', 'ребёнок', 'ребенок', 'для детей']],
    ];

    for (const [slug, keywords] of slugOrder) {
      const name = evt.name.toLowerCase();
      if (keywords.some(k => name.includes(k.toLowerCase()))) {
        const id = catMap.get(slug);
        if (id) return id;
      }
    }
    return catMap.get('kontserty'); // fallback
  }

  // ── Seed (fallback when DB empty) ──

  async seedInitialEvents(): Promise<number> {
    const count = await this.prisma.event.count({ where: { externalSource: null } });
    if (count > 0) {
      this.logger.log(`Seed events already exist (${count}), skipping`);
      return 0;
    }

    const existingAny = await this.prisma.event.count();
    if (existingAny > 20) {
      this.logger.log(`Already have ${existingAny} events, skipping seed`);
      return 0;
    }

    const slugToId: Record<string, string> = {};
    for (const c of EVENT_CATEGORIES) {
      const cat = await this.prisma.category.findUnique({ where: { slug: c.slug } });
      if (cat) slugToId[c.slug] = cat.id;
    }

    const events = [
      { title: 'Чехов. Рассказы', desc: 'Спектакль по ранним рассказам А.П. Чехова в постановке Чехов-центра.', short: 'Спектакль Чехов-центра по ранним рассказам Чехова', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 3, free: false, price: 800, img: 'https://img.culture.ru/event/eb14eece-ae80-4ec8-9c3d-5e95b9bf3660.jpg', ticket: 'https://chehovcenter.ru/afisha' },
      { title: 'Концерт симфонического оркестра «Времена года»', desc: 'Сахалинский симфонический оркестр представляет программу «Времена года». Вивальди, Чайковский, Пьяццолла.', short: 'Сахалинский симфонический оркестр — Вивальди, Чайковский, Пьяццолла', cat: 'kontserty', venue: 'Сахалинская филармония', addr: 'ул. Горького, 7', d: 4, free: false, price: 500, ticket: 'https://sakhfil.ru/afisha' },
      { title: 'Выставка «Сахалин в акварели»', desc: 'Более 50 акварельных работ сахалинских художников, посвящённых природе и городам острова.', short: 'Акварельные работы сахалинских художников', cat: 'vystavki', venue: 'Художественный музей', addr: 'ул. Ленина, 137', d: 0, endOff: 14, free: true, ticket: 'https://sakhartmuseum.ru' },
      { title: 'Мюзикл «Алые паруса»', desc: 'Знаменитый мюзикл по повести А. Грина. История о любви, вере и мечте.', short: 'Мюзикл по повести А. Грина', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 7, free: false, price: 1200, ticket: 'https://chehovcenter.ru/afisha' },
      { title: 'Спектакль «Гроза»', desc: 'Классическая постановка пьесы А.Н. Островского «Гроза» в современном прочтении.', short: 'Классика Островского в современной постановке', cat: 'teatr', venue: 'Театр кукол', addr: 'ул. Карла Маркса, 24', d: 5, free: false, price: 600, ticket: 'https://sakhpuppet.ru/afisha' },
      { title: 'Джазовый вечер «Сахалинские ритмы»', desc: 'Джаз с участием сахалинских музыкантов и приглашённых звёзд.', short: 'Джаз от сахалинских музыкантов', cat: 'kontserty', venue: 'ДК «Родина»', addr: 'пр. Мира, 16', d: 6, free: false, price: 400, ticket: 'https://dk-rodina.ru/afisha' },
      { title: 'Фестиваль «Край света»', desc: 'Международный фестиваль кино и театра. Показы, мастер-классы, встречи с режиссёрами.', short: 'Международный фестиваль кино и театра', cat: 'festivali', venue: 'ККЗ «Октябрь»', addr: 'пл. Ленина, 1', d: 10, endOff: 17, free: false, price: 300, ticket: 'https://kray-sveta.ru' },
      { title: 'Экскурсия «По следам первооткрывателей»', desc: 'Пешеходная экскурсия по историческому центру Южно-Сахалинска.', short: 'Пешеходная экскурсия по центру города', cat: 'ekskursii', venue: 'Краеведческий музей', addr: 'ул. Ленина, 137', d: 1, free: false, price: 350, ticket: 'https://sakhalinmuseum.ru' },
      { title: 'Чемпионат по волейболу Сахалинской области', desc: 'Финальные игры чемпионата Сахалинской области по волейболу.', short: 'Финальные игры чемпионата области', cat: 'sport', venue: 'СК «Кристалл»', addr: 'ул. Горького, 11', d: 8, endOff: 9, free: false, price: 200, ticket: 'https://sport.sakhalin.gov.ru' },
      { title: 'Мастер-класс «Сахалинская кухня»', desc: 'Кулинарный мастер-класс: уха по-сахалински, папоротник, кета в сливочном соусе.', short: 'Готовим блюда сахалинской кухни', cat: 'master-klassy', venue: 'Ресторан «Остров»', addr: 'ул. Сахалинская, 52', d: 2, free: false, price: 1500 },
      { title: 'Кинопоказ «Остров — 2026»', desc: 'Премьера документального фильма о природе и жизни на Сахалине.', short: 'Премьера документального фильма', cat: 'kino', venue: 'Кинотеатр «Премьер»', addr: 'ул. Ленина, 96', d: 3, free: true, ticket: 'https://kinopremier65.ru' },
      { title: 'Балет «Лебединое озеро»', desc: 'Классический балет П.И. Чайковского в исполнении Сахалинского театра балета.', short: 'Классический балет', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 12, free: false, price: 1500, ticket: 'https://chehovcenter.ru/afisha' },
      { title: 'Выставка «Море и люди Сахалина»', desc: 'Фотовыставка работ сахалинских фотографов.', short: 'Фотовыставка о море и людях Сахалина', cat: 'vystavki', venue: 'Художественный музей', addr: 'ул. Ленина, 137', d: 0, endOff: 30, free: true, ticket: 'https://sakhartmuseum.ru' },
      { title: 'Стендап: Открытый микрофон', desc: 'Вечер юмора от сахалинских комиков. Вход за донат.', short: 'Вечер стендапа', cat: 'kontserty', venue: 'Бар «Шторм»', addr: 'ул. Чехова, 63', d: 6, free: true },
      { title: 'Детский спектакль «Золотой ключик»', desc: 'Музыкальный спектакль для всей семьи по мотивам сказки А. Толстого.', short: 'Спектакль для детей по Буратино', cat: 'detyam', venue: 'Театр кукол', addr: 'ул. Карла Маркса, 24', d: 11, free: false, price: 400, ticket: 'https://sakhpuppet.ru/afisha' },
    ];

    for (const evt of events) {
      const sd = new Date(now);
      sd.setDate(sd.getDate() + evt.d);
      sd.setHours(18, 0, 0, 0);
      let ed: Date | undefined;
      if (evt.endOff !== undefined) {
        ed = new Date(now);
        ed.setDate(ed.getDate() + evt.endOff);
        ed.setHours(20, 0, 0, 0);
      }
      await this.prisma.event.create({
        data: {
          title: evt.title,
          description: evt.desc,
          shortDescription: evt.short,
          categoryId: slugToId[evt.cat],
          city: 'Южно-Сахалинск',
          venueName: evt.venue,
          venueAddress: evt.addr,
          startDate: sd,
          endDate: ed,
          isFree: evt.free,
          price: evt.price ?? undefined,
          currency: 'RUB',
          imageUrl: evt.img ?? undefined,
          ticketUrl: evt.ticket ?? undefined,
          status: 'published',
        },
      });
    }

    this.logger.log(`Seeded ${events.length} initial events`);
    return events.length;
  }
}
