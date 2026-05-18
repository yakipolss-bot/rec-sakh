import type { PageContextServer } from 'vike/types';

// Inline minimal mock data for SSR (avoids import issues)
const mockArticles: Record<string, any> = {
  'n1': {
    title: 'Штормовое предупреждение объявлено по Сахалинской области',
    lead: 'Ветер усилится до 25 м/с, порывы до 30 м/с.',
    mainImageUrl: '/images/hero-main.jpg',
    category: { name: 'Происшествия', slug: 'proisshestviya' },
    author: { name: 'Иван Петров' },
    publishedAt: '2026-05-16T06:30:00+11:00',
    updatedAt: '2026-05-16T10:30:00+11:00',
    slug: 'shtormovoe-preduprezhdenie-po-sakhalinskoy-oblasti',
  },
  'n2': {
    title: 'Новый торговый центр открылся в центре Южно-Сахалинска',
    lead: 'На улице Ленина открылся ТЦ «Остров» с площадью 15 000 м².',
    mainImageUrl: '/images/news-city.jpg',
    category: { name: 'Общество', slug: 'obshchestvo' },
    author: { name: 'Анна Кузнецова' },
    publishedAt: '2026-05-16T08:15:00+11:00',
    updatedAt: '2026-05-16T08:15:00+11:00',
    slug: 'novyy-torgovyy-tsentr-v-yuzhno-sakhalinske',
  },
  'n3': {
    title: 'Паромное сообщение Ванино-Холмск: новое расписание на лето',
    lead: 'С 1 июня вводится дополнительный рейс на паромной переправе.',
    mainImageUrl: '/images/news-port.jpg',
    category: { name: 'Транспорт', slug: 'transport' },
    author: { name: 'Мария Соколова' },
    publishedAt: '2026-05-16T09:42:00+11:00',
    updatedAt: '2026-05-16T09:42:00+11:00',
    slug: 'paromnoe-soobshchenie-vanino-kholmsk-raspisanie',
  },
  'shtormovoe-preduprezhdenie-po-sakhalinskoy-oblasti': {
    title: 'Штормовое предупреждение объявлено по Сахалинской области',
    lead: 'Ветер усилится до 25 м/с, порывы до 30 м/с.',
    mainImageUrl: '/images/hero-main.jpg',
    category: { name: 'Происшествия', slug: 'proisshestviya' },
    author: { name: 'Иван Петров' },
    publishedAt: '2026-05-16T06:30:00+11:00',
    updatedAt: '2026-05-16T10:30:00+11:00',
    slug: 'shtormovoe-preduprezhdenie-po-sakhalinskoy-oblasti',
  },
  'novyy-torgovyy-tsentr-v-yuzhno-sakhalinske': {
    title: 'Новый торговый центр открылся в центре Южно-Сахалинска',
    lead: 'На улице Ленина открылся ТЦ «Остров» с площадью 15 000 м².',
    mainImageUrl: '/images/news-city.jpg',
    category: { name: 'Общество', slug: 'obshchestvo' },
    author: { name: 'Анна Кузнецова' },
    publishedAt: '2026-05-16T08:15:00+11:00',
    updatedAt: '2026-05-16T08:15:00+11:00',
    slug: 'novyy-torgovyy-tsentr-v-yuzhno-sakhalinske',
  },
  'paromnoe-soobshchenie-vanino-kholmsk-raspisanie': {
    title: 'Паромное сообщение Ванино-Холмск: новое расписание на лето',
    lead: 'С 1 июня вводится дополнительный рейс на паромной переправе.',
    mainImageUrl: '/images/news-port.jpg',
    category: { name: 'Транспорт', slug: 'transport' },
    author: { name: 'Мария Соколова' },
    publishedAt: '2026-05-16T09:42:00+11:00',
    updatedAt: '2026-05-16T09:42:00+11:00',
    slug: 'paromnoe-soobshchenie-vanino-kholmsk-raspisanie',
  },
  'v-sakhalinskoy-tayge-obnaruzheny-redkie-vidy-ptits': {
    title: 'В сахалинской тайге обнаружены редкие виды птиц',
    lead: 'Орнитологи зафиксировали гнездование дальневосточного аиста.',
    mainImageUrl: '/images/news-nature.jpg',
    category: { name: 'Природа', slug: 'priroda' },
    author: { name: 'Елена Морозова' },
    publishedAt: '2026-05-15T14:20:00+11:00',
    updatedAt: '2026-05-15T14:20:00+11:00',
    slug: 'v-sakhalinskoy-tayge-obnaruzheny-redkie-vidy-ptits',
  },
};

export { onBeforeRender };

async function onBeforeRender(pageContext: PageContextServer) {
  const { id } = pageContext.routeParams || {};
  if (!id) return;

  const article = mockArticles[id];
  if (!article) return;

  pageContext.seo = {
    title: article.title,
    description: article.lead,
    image: article.mainImageUrl || '',
    article: {
      title: article.title,
      description: article.lead,
      image: article.mainImageUrl || '',
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      author: article.author.name,
      category: article.category.name,
      slug: article.slug,
    },
  };
}
