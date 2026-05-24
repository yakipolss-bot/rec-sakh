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

  // ── Seed (re-created every API restart to keep dates fresh) ──

  async seedInitialEvents(): Promise<number> {
    const now = new Date();
    const slugToId: Record<string, string> = {};
    for (const c of EVENT_CATEGORIES) {
      const cat = await this.prisma.category.findUnique({ where: { slug: c.slug } });
      if (cat) slugToId[c.slug] = cat.id;
    }

    const events = [
      // ── Кино ──
      { title: '«Аватар: Путь воды»', desc: 'Продолжение эпической саги Джеймса Кэмерона. Потрясающие визуальные эффекты, захватывающий сюжет.', short: 'Фантастический блокбастер Джеймса Кэмерона', cat: 'kino', venue: 'Кинотеатр «Октябрь»', addr: 'пл. Ленина, 1', d: 1, free: false, price: 450, img: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&h=400&fit=crop', ticket: 'https://kino65.ru' },
      { title: '«Холоп-2»', desc: 'Комедия о том, как мажор снова попадает в непривычную обстановку. Продолжение самого кассового российского фильма.', short: 'Российская комедия — продолжение хита', cat: 'kino', venue: 'Кинотеатр «Премьер»', addr: 'ул. Ленина, 96', d: 2, free: false, price: 350, img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop', ticket: 'https://kinopremier65.ru' },
      { title: 'Кинопоказ «Остров — 2026»', desc: 'Премьера документального фильма о природе и жизни на Сахалине.', short: 'Премьера документального фильма', cat: 'kino', venue: 'Кинотеатр «Премьер»', addr: 'ул. Ленина, 96', d: 3, free: true, img: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&h=400&fit=crop', ticket: 'https://kinopremier65.ru' },
      { title: '«Дюна: Часть вторая»', desc: 'Пол Видираес продолжает свой путь по пустынной планете Арракис.', short: 'Фантастика Дени Вильнёва', cat: 'kino', venue: 'Кинотеатр «Октябрь»', addr: 'пл. Ленина, 1', d: 4, free: false, price: 500, img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop', ticket: 'https://kino65.ru' },
      { title: '«Лёд-3»', desc: 'Романтическая музыкальная драма о любви, фигурном катании и преодолении.', short: 'Российская драма о фигурном катании', cat: 'kino', venue: 'Кинотеатр «Премьер»', addr: 'ул. Ленина, 96', d: 5, free: false, price: 380, img: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=600&h=400&fit=crop' },
      { title: '«Гарри Поттер: Философский камень»', desc: 'Культовый фильм возвращается на большой экран в обновлённой версии.', short: 'Культовое фэнтези', cat: 'kino', venue: 'Кинотеатр «Октябрь»', addr: 'пл. Ленина, 1', d: 6, free: false, price: 400, img: 'https://images.unsplash.com/photo-1506466010722-395aa2deb877?w=600&h=400&fit=crop', ticket: 'https://kino65.ru' },
      { title: '«Чебурашка»', desc: 'Добрая семейная комедия о приключениях ушастого зверька в провинциальном городке.', short: 'Семейная комедия', cat: 'kino', venue: 'Кинотеатр «Премьер»', addr: 'ул. Ленина, 96', d: 0, free: false, price: 300, img: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=400&fit=crop', ticket: 'https://kinopremier65.ru' },
      { title: '«Барби»', desc: 'Барби покидает идеальный Барбиленд и отправляется в реальный мир. Яркая комедия Греты Гервиг.', short: 'Комедия Греты Гервиг', cat: 'kino', venue: 'Кинотеатр «Премьер»', addr: 'ул. Ленина, 96', d: 7, free: false, price: 420, img: 'https://images.unsplash.com/photo-1560109947-2b3d3ad5b41c?w=600&h=400&fit=crop', ticket: 'https://kinopremier65.ru' },
      { title: '«Оппенгеймер»', desc: 'История создателя атомной бомбы. Биографическая драма Кристофера Нолана.', short: 'Биографическая драма Нолана', cat: 'kino', venue: 'Кинотеатр «Октябрь»', addr: 'пл. Ленина, 1', d: 8, free: false, price: 480, img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=400&fit=crop', ticket: 'https://kino65.ru' },
      { title: '«По щучьему велению»', desc: 'Сказочный блокбастер по мотивам русских народных сказок. Яркие спецэффекты и любимые герои.', short: 'Российская сказка-блокбастер', cat: 'kino', venue: 'Кинотеатр «Премьер»', addr: 'ул. Ленина, 96', d: 9, free: false, price: 320, img: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop', ticket: 'https://kinopremier65.ru' },
      // ── Театр ──
      { title: 'Чехов. Рассказы', desc: 'Спектакль по ранним рассказам А.П. Чехова в постановке Чехов-центра.', short: 'Спектакль Чехов-центра', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 3, free: false, price: 800, img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop', ticket: 'https://chehovcenter.ru/afisha' },
      { title: 'Мюзикл «Алые паруса»', desc: 'Знаменитый мюзикл по повести А. Грина. История о любви, вере и мечте.', short: 'Мюзикл по повести А. Грина', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 7, free: false, price: 1200, img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop', ticket: 'https://chehovcenter.ru/afisha' },
      { title: 'Спектакль «Гроза»', desc: 'Классическая постановка пьесы А.Н. Островского в современном прочтении.', short: 'Классика Островского', cat: 'teatr', venue: 'Театр кукол', addr: 'ул. Карла Маркса, 24', d: 5, free: false, price: 600, img: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop', ticket: 'https://sakhpuppet.ru/afisha' },
      { title: 'Балет «Лебединое озеро»', desc: 'Классический балет П.И. Чайковского в исполнении Сахалинского театра балета.', short: 'Классический балет', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 12, free: false, price: 1500, img: 'https://images.unsplash.com/photo-1540039155733-5bb30b53e2bc?w=600&h=400&fit=crop', ticket: 'https://chehovcenter.ru/afisha' },
      { title: 'Спектакль «Вишнёвый сад»', desc: 'Знаменитая пьеса Чехова в постановке режиссёра Дмитрия Крестьянкина.', short: 'Чеховская классика', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 14, free: false, price: 900, img: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=600&h=400&fit=crop', ticket: 'https://chehovcenter.ru/afisha' },
      { title: 'Моноспектакль «Письма с фронта»', desc: 'Пронзительная постановка по真实ным письмам солдат Великой Отечественной войны.', short: 'Драматический моноспектакль', cat: 'teatr', venue: 'Театр кукол', addr: 'ул. Карла Маркса, 24', d: 10, free: false, price: 500, img: 'https://images.unsplash.com/photo-1518893883800-45cd0954574b?w=600&h=400&fit=crop', ticket: 'https://sakhpuppet.ru/afisha' },
      { title: 'Спектакль «Мастер и Маргарита»', desc: 'Сценическая версия культового романа Булгакова. Мистика, любовь и сатира.', short: 'Булгаков на сцене', cat: 'teatr', venue: 'Чехов-центр', addr: 'пл. Ленина, 1', d: 16, free: false, price: 1100, img: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=600&h=400&fit=crop', ticket: 'https://chehovcenter.ru/afisha' },
      // ── Концерты ──
      { title: 'Концерт симфонического оркестра «Времена года»', desc: 'Сахалинский симфонический оркестр представляет программу «Времена года». Вивальди, Чайковский, Пьяццолла.', short: 'Симфонический оркестр', cat: 'kontserty', venue: 'Сахалинская филармония', addr: 'ул. Горького, 7', d: 4, free: false, price: 500, img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800b?w=600&h=400&fit=crop', ticket: 'https://sakhfil.ru/afisha' },
      { title: 'Джазовый вечер «Сахалинские ритмы»', desc: 'Джаз с участием сахалинских музыкантов и приглашённых звёзд.', short: 'Джазовый концерт', cat: 'kontserty', venue: 'ДК «Родина»', addr: 'пр. Мира, 16', d: 6, free: false, price: 400, img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&h=400&fit=crop', ticket: 'https://dk-rodina.ru/afisha' },
      { title: 'Стендап: Открытый микрофон', desc: 'Вечер юмора от сахалинских комиков. Вход за донат.', short: 'Вечер стендапа', cat: 'kontserty', venue: 'Бар «Шторм»', addr: 'ул. Чехова, 63', d: 6, free: true, img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&h=400&fit=crop' },
      { title: 'Рок-концерт «Островной драйв»', desc: 'Сахалинские рок-группы: «Шторм», «Берег», «45-й меридиан». Громко и драйвово!', short: 'Концерт сахалинских рок-групп', cat: 'kontserty', venue: 'ДК «Родина»', addr: 'пр. Мира, 16', d: 8, free: false, price: 600, img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop', ticket: 'https://dk-rodina.ru/afisha' },
      { title: 'Концерт фортепианной музыки', desc: 'Лауреат международных конкурсов Александр Пирогов исполняет Шопена, Рахманинова и Прокофьева.', short: 'Фортепианный вечер', cat: 'kontserty', venue: 'Сахалинская филармония', addr: 'ул. Горького, 7', d: 11, free: false, price: 700, img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&h=400&fit=crop', ticket: 'https://sakhfil.ru/afisha' },
      { title: 'Хиты 90-х: дискотека', desc: 'Легендарные хиты десятилетия в исполнении кавер-группы «Ретро-Сахалин».', short: 'Дискотека с хитами 90-х', cat: 'kontserty', venue: 'Ночной клуб «Айсберг»', addr: 'ул. Сахалинская, 15', d: 13, free: false, price: 350, img: 'https://images.unsplash.com/photo-1571266028243-3716f02d2dff?w=600&h=400&fit=crop' },
      { title: 'Караоке-батл «Голос Сахалина»', desc: 'Отборочный тур караоке-чемпионата. Приз — запись профессионального трека.', short: 'Караоке-соревнование', cat: 'kontserty', venue: 'Бар «Шторм»', addr: 'ул. Чехова, 63', d: 0, free: true, img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&h=400&fit=crop' },
      // ── Выставки ──
      { title: 'Выставка «Сахалин в акварели»', desc: 'Более 50 акварельных работ сахалинских художников о природе и городах острова.', short: 'Акварельные работы', cat: 'vystavki', venue: 'Художественный музей', addr: 'ул. Ленина, 137', d: 0, endOff: 14, free: true, img: 'https://images.unsplash.com/photo-1531913764164-f85c5e25e58f?w=600&h=400&fit=crop', ticket: 'https://sakhartmuseum.ru' },
      { title: 'Выставка «Море и люди Сахалина»', desc: 'Фотовыставка работ сахалинских фотографов.', short: 'Фотовыставка', cat: 'vystavki', venue: 'Художественный музей', addr: 'ул. Ленина, 137', d: 0, endOff: 30, free: true, img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop', ticket: 'https://sakhartmuseum.ru' },
      { title: 'Выставка «История освоения Сахалина»', desc: 'Артефакты, карты и документы экспедиций Невельского, Бошняка и других первооткрывателей.', short: 'Историческая экспозиция', cat: 'vystavki', venue: 'Краеведческий музей', addr: 'ул. Ленина, 137', d: 2, endOff: 60, free: false, price: 250, img: 'https://images.unsplash.com/photo-1563986768711-b3bde3dc821e?w=600&h=400&fit=crop', ticket: 'https://sakhalinmuseum.ru' },
      { title: 'Арт-инсталляция «Свет Севера»', desc: 'Световая инсталляция сахалинских художников в пространстве Арт-галереи «123».', short: 'Световая инсталляция', cat: 'vystavki', venue: 'Арт-галерея «123»', addr: 'ул. Дзержинского, 23', d: 5, endOff: 21, free: false, price: 300, img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&h=400&fit=crop' },
      { title: 'Выставка «Куклы народов мира»', desc: 'Уникальная коллекция кукол в национальных костюмах из фондов музея.', short: 'Коллекция кукол', cat: 'vystavki', venue: 'Краеведческий музей', addr: 'ул. Ленина, 137', d: 3, endOff: 45, free: false, price: 200, img: 'https://images.unsplash.com/photo-1595009556555-90a6bd0a7c7d?w=600&h=400&fit=crop', ticket: 'https://sakhalinmuseum.ru' },
      { title: 'Выставка «Советский Сахалин»', desc: 'Фотографии и предметы быта сахалинцев советской эпохи. Ностальгическое путешествие в прошлое.', short: 'Советская эпоха на Сахалине', cat: 'vystavki', venue: 'Художественный музей', addr: 'ул. Ленина, 137', d: 7, endOff: 35, free: false, price: 200, img: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&h=400&fit=crop', ticket: 'https://sakhartmuseum.ru' },
      // ── Фестивали ──
      { title: 'Фестиваль «Край света»', desc: 'Международный фестиваль кино и театра. Показы, мастер-классы, встречи с режиссёрами.', short: 'Кино-театральный фестиваль', cat: 'festivali', venue: 'ККЗ «Октябрь»', addr: 'пл. Ленина, 1', d: 10, endOff: 17, free: false, price: 300, img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop', ticket: 'https://kray-sveta.ru' },
      { title: 'Гастрофест «Вкусы Сахалина»', desc: 'Фестиваль сахалинской кухни: морепродукты, дикоросы, крафтовые напитки. Дегустации и мастер-классы.', short: 'Фестиваль сахалинской кухни', cat: 'festivali', venue: 'Городской парк', addr: 'ул. Сахалинская, 1', d: 5, endOff: 7, free: false, price: 100, img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop' },
      { title: 'День рыбака — городской праздник', desc: 'Праздничные гуляния, конкурсы, уха от шеф-поваров, концерт.', short: 'Городской праздник', cat: 'festivali', venue: 'Набережная', addr: 'ул. Пограничная', d: 14, endOff: 14, free: true, img: 'https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?w=600&h=400&fit=crop' },
      { title: 'Фестиваль «Сахалинская гитара»', desc: 'Фестиваль авторской песни и гитарной музыки. Участники со всего Дальнего Востока.', short: 'Фестиваль авторской песни', cat: 'festivali', venue: 'Городской парк', addr: 'ул. Сахалинская, 1', d: 18, endOff: 20, free: true, img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop' },
      { title: 'Фестиваль воздушных змеев «Выше неба»', desc: 'Красочный фестиваль на побережье. Мастер-классы, конкурсы, файер-шоу.', short: 'Фестиваль воздушных змеев', cat: 'festivali', venue: 'Пляж «Анива»', addr: 'с. Анива, побережье', d: 21, endOff: 21, free: true, img: 'https://images.unsplash.com/photo-1532017861838-5c716a5b2b03?w=600&h=400&fit=crop' },
      // ── Экскурсии ──
      { title: 'Экскурсия «По следам первооткрывателей»', desc: 'Пешеходная экскурсия по историческому центру Южно-Сахалинска.', short: 'Пешеходная экскурсия по центру', cat: 'ekskursii', venue: 'Краеведческий музей', addr: 'ул. Ленина, 137', d: 1, free: false, price: 350, img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=400&fit=crop', ticket: 'https://sakhalinmuseum.ru' },
      { title: 'Тур на мыс Великан', desc: 'Автобусно-пешеходный тур к уникальным скалам и гротам мыса Великан.', short: 'Поездка на мыс Великан', cat: 'ekskursii', venue: 'Туристический клуб «Бумеранг»', addr: 'ул. Ленина, 50', d: 2, free: false, price: 2500, img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop' },
      { title: 'Экскурсия на маяк Анива', desc: 'Захватывающее путешествие на самый известный маяк Сахалина. Трансфер и сопровождение.', short: 'Поездка на маяк Анива', cat: 'ekskursii', venue: 'Туристический клуб «Бумеранг»', addr: 'ул. Ленина, 50', d: 4, free: false, price: 3500, img: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&h=400&fit=crop' },
      { title: 'Экскурсия на горелую сопку', desc: 'Восхождение на вулкан с видом на город. Гид расскажет о геологии и истории региона.', short: 'Восхождение на вулкан', cat: 'ekskursii', venue: 'Турклуб «Вершина»', addr: 'пр. Мира, 10', d: 0, free: false, price: 1800, img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop' },
      { title: 'Морская прогулка в залив Анива', desc: 'Прогулка на катере с наблюдением за птицами и морскими животными.', short: 'Морская прогулка', cat: 'ekskursii', venue: 'Причал', addr: 'порт Корсаков', d: 6, free: false, price: 3000, img: 'https://images.unsplash.com/photo-1538132843552-5b13010246ef?w=600&h=400&fit=crop' },
      { title: 'Экскурсия на озеро Тунайча', desc: 'Экотур на крупнейшее озеро Южного Сахалина. Купание, рыбалка, обед на природе.', short: 'Экотур на озеро', cat: 'ekskursii', venue: 'Турклуб «Бумеранг»', addr: 'ул. Ленина, 50', d: 8, free: false, price: 2200, img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop' },
      // ── Спорт ──
      { title: 'Чемпионат по волейболу Сахалинской области', desc: 'Финальные игры чемпионата Сахалинской области по волейболу.', short: 'Финалы по волейболу', cat: 'sport', venue: 'СК «Кристалл»', addr: 'ул. Горького, 11', d: 8, endOff: 9, free: false, price: 200, img: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf2b?w=600&h=400&fit=crop', ticket: 'https://sport.sakhalin.gov.ru' },
      { title: 'Турнир по мини-футболу «Кубок Сахалина»', desc: 'Соревнования среди любительских команд области.', short: 'Любительский футбол', cat: 'sport', venue: 'Стадион «Спартак»', addr: 'ул. Горького, 3', d: 3, endOff: 5, free: false, price: 100, img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop' },
      { title: 'Забег «Сахалинский марафон»', desc: 'Полумарафон по живописному маршруту вдоль побережья. Участие бесплатное.', short: 'Полумарафон', cat: 'sport', venue: 'Набережная', addr: 'ул. Пограничная', d: 12, endOff: 12, free: true, img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop' },
      { title: 'Чемпионат по дзюдо среди юниоров', desc: 'Открытое первенство Сахалинской области по дзюдо.', short: 'Дзюдо — первенство области', cat: 'sport', venue: 'Спорткомплекс «Восток»', addr: 'ул. Украинская, 1', d: 6, endOff: 7, free: false, price: 150, img: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&h=400&fit=crop' },
      { title: 'Турнир по настольному теннису', desc: 'Любительский турнир. Открыто для всех желающих.', short: 'Настольный теннис', cat: 'sport', venue: 'СК «Кристалл»', addr: 'ул. Горького, 11', d: 10, endOff: 10, free: false, price: 200, img: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=600&h=400&fit=crop' },
      { title: 'Соревнования по плаванию «Кубок залива»', desc: 'Заплывы на открытой воде в бухте Тихая.', short: 'Плавание на открытой воде', cat: 'sport', venue: 'Бухта Тихая', addr: 'с. Пригородное', d: 15, endOff: 15, free: true, img: 'https://images.unsplash.com/photo-1530549387789-4c1017266639?w=600&h=400&fit=crop' },
      // ── Мастер-классы ──
      { title: 'Мастер-класс «Сахалинская кухня»', desc: 'Кулинарный мастер-класс: уха по-сахалински, папоротник, кета в сливочном соусе.', short: 'Готовим сахалинскую кухню', cat: 'master-klassy', venue: 'Ресторан «Остров»', addr: 'ул. Сахалинская, 52', d: 2, free: false, price: 1500, img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop' },
      { title: 'Мастер-класс по гончарному делу', desc: 'Научитесь работать с глиной и создадите собственное керамическое изделие.', short: 'Гончарное дело', cat: 'master-klassy', venue: 'Арт-студия «Глина»', addr: 'ул. Чехова, 30', d: 0, free: false, price: 1200, img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=400&fit=crop' },
      { title: 'Мастер-класс по фотографии «Сахалин в кадре»', desc: 'Научитесь профессионально фотографировать природу и архитектуру.', short: 'Фотомастер-класс', cat: 'master-klassy', venue: 'Городской парк', addr: 'ул. Сахалинская, 1', d: 4, free: false, price: 800, img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop' },
      { title: 'Мастер-класс по игре на гитаре', desc: 'Базовый курс для начинающих. Научитесь играть любимые песни за одно занятие.', short: 'Уроки игры на гитаре', cat: 'master-klassy', venue: 'Музыкальная школа №1', addr: 'ул. Мира, 5', d: 7, free: false, price: 600, img: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop' },
      { title: 'Мастер-класс по рисованию «Северное сияние»', desc: 'Напишем картину акрилом — северное сияние над Сахалином.', short: 'Рисование акрилом', cat: 'master-klassy', venue: 'Арт-студия «Глина»', addr: 'ул. Чехова, 30', d: 9, free: false, price: 1000, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop' },
      { title: 'Мастер-класс «Резьба по дереву»', desc: 'Традиционное ремесло Сахалина. Изготовим сувенир из капа берёзы.', short: 'Резьба по дереву', cat: 'master-klassy', venue: 'Дом ремёсел', addr: 'ул. Ленина, 80', d: 11, free: false, price: 900, img: 'https://images.unsplash.com/photo-1562101775-6ab3d3f2f3c6?w=600&h=400&fit=crop' },
      // ── Обучение ──
      { title: 'Лекция «История Сахалинского края»', desc: 'Цикл лекций от кандидата исторических наук. Погружение в историю региона.', short: 'Историческая лекция', cat: 'obuchenie', venue: 'Научная библиотека', addr: 'ул. Ленина, 137', d: 0, free: true, img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop' },
      { title: 'Курс «Основы программирования на Python»', desc: 'Бесплатный двухнедельный курс для начинающих в IT-коворкинге.', short: 'Курс Python для начинающих', cat: 'obuchenie', venue: 'IT-коворкинг «Код»', addr: 'ул. Сахалинская, 25', d: 1, endOff: 14, free: true, img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop', ticket: 'https://it-sakh.ru/courses' },
      { title: 'Мастер-класс по английскому языку', desc: 'Разговорный клуб с носителем языка. Преодолеем языковой барьер.', short: 'Разговорный английский', cat: 'obuchenie', venue: 'Центр изучения языков', addr: 'ул. Чехова, 12', d: 3, free: false, price: 500, img: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=400&fit=crop' },
      { title: 'Лекция «Морские млекопитающие Сахалина»', desc: 'Научно-популярная лекция о китах, тюленях и сивучах у берегов Сахалина.', short: 'Лекция о китах и тюленях', cat: 'obuchenie', venue: 'Краеведческий музей', addr: 'ул. Ленина, 137', d: 6, free: false, price: 200, img: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=600&h=400&fit=crop', ticket: 'https://sakhalinmuseum.ru' },
      { title: 'Курс «Садоводство на Сахалине»', desc: 'Как выращивать овощи и цветы в условиях сахалинского климата. Практические советы.', short: 'Курс садоводства', cat: 'obuchenie', venue: 'Ботанический сад', addr: 'ул. Горького, 15', d: 10, endOff: 17, free: false, price: 1500, img: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&h=400&fit=crop' },
      // ── Детям ──
      { title: 'Детский спектакль «Золотой ключик»', desc: 'Музыкальный спектакль для всей семьи по мотивам сказки А. Толстого.', short: 'Спектакль по Буратино', cat: 'detyam', venue: 'Театр кукол', addr: 'ул. Карла Маркса, 24', d: 11, free: false, price: 400, img: 'https://images.unsplash.com/photo-1503454537925-8f6a7a5af0c4?w=600&h=400&fit=crop', ticket: 'https://sakhpuppet.ru/afisha' },
      { title: 'Интерактивное шоу «Наука — это весело!»', desc: 'Химические опыты, физические эксперименты и научные фокусы для детей от 5 лет.', short: 'Научное шоу для детей', cat: 'detyam', venue: 'ДК «Родина»', addr: 'пр. Мира, 16', d: 4, free: false, price: 500, img: 'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=600&h=400&fit=crop', ticket: 'https://dk-rodina.ru/afisha' },
      { title: 'Кукольный спектакль «Колобок»', desc: 'Любимая сказка в исполнении кукольного театра. Для самых маленьких зрителей.', short: 'Кукольный спектакль', cat: 'detyam', venue: 'Театр кукол', addr: 'ул. Карла Маркса, 24', d: 2, free: false, price: 300, img: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=600&h=400&fit=crop', ticket: 'https://sakhpuppet.ru/afisha' },
      { title: 'Детский мастер-класс «Весёлые краски»', desc: 'Рисование пальчиковыми красками для детей от 2 до 5 лет.', short: 'Рисование для малышей', cat: 'detyam', venue: 'Арт-студия «Глина»', addr: 'ул. Чехова, 30', d: 6, free: false, price: 400, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop' },
      { title: 'Спектакль «Теремок»', desc: 'Весёлый музыкальный спектакль по мотивам русской народной сказки.', short: 'Музыкальная сказка', cat: 'detyam', venue: 'Театр кукол', addr: 'ул. Карла Маркса, 24', d: 9, free: false, price: 350, img: 'https://images.unsplash.com/photo-1478358161113-b0e11994a36b?w=600&h=400&fit=crop', ticket: 'https://sakhpuppet.ru/afisha' },
      { title: 'Детская дискотека «Танцуют все!»', desc: 'Анимационная программа с конкурсами, танцами и сладкими призами.', short: 'Детская дискотека', cat: 'detyam', venue: 'ДК «Родина»', addr: 'пр. Мира, 16', d: 13, free: false, price: 250, img: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600&h=400&fit=crop' },
    ];

    // Delete old seed events and re-create with fresh dates
    await this.prisma.event.deleteMany({ where: { externalSource: null } });

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

    this.logger.log(`Seeded ${events.length} events with fresh dates`);
    return events.length;
  }
}
