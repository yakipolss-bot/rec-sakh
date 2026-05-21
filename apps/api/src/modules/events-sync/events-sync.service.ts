import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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

@Injectable()
export class EventsSyncService implements OnModuleInit {
  private readonly logger = new Logger(EventsSyncService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureEventCategories();
    await this.seedInitialEvents();
  }

  private async mapSlug(slug: string): Promise<string | null> {
    const cat = await this.prisma.category.findUnique({ where: { slug } });
    return cat?.id ?? null;
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

  async seedInitialEvents(): Promise<number> {
    const count = await this.prisma.event.count();
    if (count > 0) {
      this.logger.log(`Events already exist (${count}), skipping seed`);
      return 0;
    }

    const now = new Date();
    const day = (offset: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(18, 0, 0, 0);
      return d;
    };

    const events = [
      {
        title: 'Чехов. Рассказы',
        description: 'Спектакль по ранним рассказам А.П. Чехова в постановке Чехов-центра. Ироничные, трогательные и вечные истории от классика русской литературы.',
        shortDescription: 'Спектакль Чехов-центра по ранним рассказам Чехова',
        catSlug: 'teatr',
        venueName: 'Чехов-центр',
        venueAddress: 'пл. Ленина, 1',
        startDate: day(3),
        endDate: day(3),
        isFree: false,
        price: 800,
        imageUrl: 'https://img.culture.ru/event/eb14eece-ae80-4ec8-9c3d-5e95b9bf3660.jpg',
        ticketUrl: 'https://chehovcenter.ru/afisha',
      },
      {
        title: 'Концерт симфонического оркестра «Времена года»',
        description: 'Сахалинский симфонический оркестр представляет программу «Времена года». Вивальди, Чайковский, Пьяццолла.',
        shortDescription: 'Сахалинский симфонический оркестр — Вивальди, Чайковский, Пьяццолла',
        catSlug: 'kontserty',
        venueName: 'Сахалинская филармония',
        venueAddress: 'ул. Горького, 7',
        startDate: day(4),
        endDate: day(4),
        isFree: false,
        price: 500,
        ticketUrl: 'https://sakhfil.ru/afisha',
      },
      {
        title: 'Выставка «Сахалин в акварели»',
        description: 'Выставка работ сахалинских художников в технике акварели. Более 50 работ, посвящённых природе и городам острова.',
        shortDescription: 'Акварельные работы сахалинских художников',
        catSlug: 'vystavki',
        venueName: 'Сахалинский областной художественный музей',
        venueAddress: 'ул. Ленина, 137',
        startDate: day(0),
        endDate: day(14),
        isFree: true,
        ticketUrl: 'https://sakhartmuseum.ru',
      },
      {
        title: 'Мюзикл «Алые паруса»',
        description: 'Знаменитый мюзикл по повести А. Грина. История о любви, вере и мечте, которая обязательно сбудется.',
        shortDescription: 'Мюзикл по повести А. Грина на сцене Сахалинского театра',
        catSlug: 'teatr',
        venueName: 'Сахалинский международный театральный центр',
        venueAddress: 'пл. Ленина, 1',
        startDate: day(7),
        endDate: day(7),
        isFree: false,
        price: 1200,
        ticketUrl: 'https://chehovcenter.ru/afisha',
      },
      {
        title: 'Спектакль «Гроза»',
        description: 'Классическая постановка пьесы А.Н. Островского «Гроза» в современном прочтении.',
        shortDescription: 'Классика Островского в современной постановке',
        catSlug: 'teatr',
        venueName: 'Сахалинский театр кукол',
        venueAddress: 'ул. Карла Маркса, 24',
        startDate: day(5),
        endDate: day(5),
        isFree: false,
        price: 600,
        ticketUrl: 'https://sakhpuppet.ru/afisha',
      },
      {
        title: 'Джазовый вечер «Сахалинские ритмы»',
        description: 'Вечер джазовой музыки с участием сахалинских музыкантов и приглашённых звёзд.',
        shortDescription: 'Джаз от сахалинских музыкантов',
        catSlug: 'kontserty',
        venueName: 'ДК «Родина»',
        venueAddress: 'пр. Мира, 16',
        startDate: day(6),
        endDate: day(6),
        isFree: false,
        price: 400,
        ticketUrl: 'https://dk-rodina.ru/afisha',
      },
      {
        title: 'Фестиваль «Край света»',
        description: 'Ежегодный международный фестиваль кино и театра «Край света». Показы, мастер-классы, встречи с режиссёрами.',
        shortDescription: 'Международный фестиваль кино и театра',
        catSlug: 'festivali',
        venueName: 'ККЗ «Октябрь»',
        venueAddress: 'пл. Ленина, 1',
        startDate: day(10),
        endDate: day(17),
        isFree: false,
        price: 300,
        ticketUrl: 'https://kray-sveta.ru',
      },
      {
        title: 'Экскурсия «По следам первооткрывателей»',
        description: 'Пешеходная экскурсия по историческому центру Южно-Сахалинска. Маршрут включает здание музея, исторические здания и памятники.',
        shortDescription: 'Пешеходная экскурсия по центру города',
        catSlug: 'ekskursii',
        venueName: 'Сахалинский областной краеведческий музей',
        venueAddress: 'ул. Ленина, 137',
        startDate: day(1),
        endDate: day(1),
        isFree: false,
        price: 350,
        ticketUrl: 'https://sakhalinmuseum.ru',
      },
      {
        title: 'Чемпионат по волейболу Сахалинской области',
        description: 'Финальные игры чемпионата Сахалинской области по волейболу среди мужских и женских команд.',
        shortDescription: 'Финальные игры чемпионата области по волейболу',
        catSlug: 'sport',
        venueName: 'СК «Кристалл»',
        venueAddress: 'ул. Горького, 11',
        startDate: day(8),
        endDate: day(9),
        isFree: false,
        price: 200,
        ticketUrl: 'https://sport.sakhalin.gov.ru',
      },
      {
        title: 'Мастер-класс «Сахалинская кухня»',
        description: 'Кулинарный мастер-класс по приготовлению блюд сахалинской кухни: уха по-сахалински, папоротник, кета в сливочном соусе.',
        shortDescription: 'Готовим блюда сахалинской кухни',
        catSlug: 'master-klassy',
        venueName: 'Ресторан «Остров»',
        venueAddress: 'ул. Сахалинская, 52',
        startDate: day(2),
        endDate: day(2),
        isFree: false,
        price: 1500,
        ticketUrl: null,
      },
      {
        title: 'Кинопоказ «Остров — 2026»',
        description: 'Премьерный показ документального фильма о природе и жизни на Сахалине. Вход свободный.',
        shortDescription: 'Премьера документального фильма о Сахалине',
        catSlug: 'kino',
        venueName: 'Кинотеатр «Премьер»',
        venueAddress: 'ул. Ленина, 96',
        startDate: day(3),
        endDate: day(3),
        isFree: true,
        ticketUrl: 'https://kinopremier65.ru',
      },
      {
        title: 'Балет «Лебединое озеро»',
        description: 'Классический балет П.И. Чайковского в исполнении Сахалинского театра балета.',
        shortDescription: 'Классический балет на сцене Чехов-центра',
        catSlug: 'teatr',
        venueName: 'Чехов-центр',
        venueAddress: 'пл. Ленина, 1',
        startDate: day(12),
        endDate: day(12),
        isFree: false,
        price: 1500,
        ticketUrl: 'https://chehovcenter.ru/afisha',
      },
      {
        title: 'Выставка «Море и люди Сахалина»',
        description: 'Фотовыставка работ сахалинских фотографов, посвящённая морю и людям, чья жизнь связана с ним.',
        shortDescription: 'Фотовыставка о море и людях Сахалина',
        catSlug: 'vystavki',
        venueName: 'Сахалинский областной художественный музей',
        venueAddress: 'ул. Ленина, 137',
        startDate: day(0),
        endDate: day(30),
        isFree: true,
        ticketUrl: 'https://sakhartmuseum.ru',
      },
      {
        title: 'Стендап: Открытый микрофон',
        description: 'Вечер юмора в жанре стендап. Участвуют как опытные комики, так и новички. Вход за донат.',
        shortDescription: 'Вечер стендапа от сахалинских комиков',
        catSlug: 'kontserty',
        venueName: 'Бар «Шторм»',
        venueAddress: 'ул. Чехова, 63',
        startDate: day(6),
        endDate: day(6),
        isFree: true,
        ticketUrl: null,
      },
      {
        title: 'Детский спектакль «Золотой ключик»',
        description: 'Весёлый музыкальный спектакль для всей семьи по мотивам сказки А. Толстого «Золотой ключик, или Приключения Буратино».',
        shortDescription: 'Музыкальный спектакль для детей по Буратино',
        catSlug: 'detyam',
        venueName: 'Сахалинский театр кукол',
        venueAddress: 'ул. Карла Маркса, 24',
        startDate: day(11),
        endDate: day(11),
        isFree: false,
        price: 400,
        ticketUrl: 'https://sakhpuppet.ru/afisha',
      },
    ];

    const slugToId: Record<string, string> = {};
    for (const evt of events) {
      if (!slugToId[evt.catSlug]) {
        const cat = await this.prisma.category.findUnique({ where: { slug: evt.catSlug } });
        if (!cat) {
          this.logger.warn(`Category "${evt.catSlug}" not found, skipping "${evt.title}"`);
          continue;
        }
        slugToId[evt.catSlug] = cat.id;
      }
      await this.prisma.event.create({
        data: {
          title: evt.title,
          description: evt.description,
          shortDescription: evt.shortDescription,
          categoryId: slugToId[evt.catSlug],
          city: 'Южно-Сахалинск',
          venueName: evt.venueName,
          venueAddress: evt.venueAddress,
          startDate: evt.startDate,
          endDate: evt.endDate,
          isFree: evt.isFree,
          price: evt.price ?? undefined,
          currency: 'RUB',
          imageUrl: evt.imageUrl ?? undefined,
          ticketUrl: evt.ticketUrl ?? undefined,
          status: 'published',
        },
      });
    }

    this.logger.log(`Seeded ${events.length} initial events`);
    return events.length;
  }
}
