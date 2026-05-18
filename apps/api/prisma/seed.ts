import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rec-sakh.ru' },
    update: {},
    create: {
      email: 'admin@rec-sakh.ru',
      passwordHash: adminPassword,
      name: 'Администратор',
      role: UserRole.admin,
      isEmailVerified: true,
    },
  });

  await prisma.userSetting.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log('Admin user created:', admin.email);

  // 2. Cities
  const cities = [
    { code: 'yuzhno-sakhalinsk', name: 'Yuzhno-Sakhalinsk', nameRu: 'Южно-Сахалинск', lat: 46.9592, lon: 142.738, priority: 1 },
    { code: 'korsakov', name: 'Korsakov', nameRu: 'Корсаков', lat: 46.6342, lon: 142.777, priority: 2 },
    { code: 'kholmsk', name: 'Kholmsk', nameRu: 'Холмск', lat: 47.0478, lon: 142.043, priority: 3 },
    { code: 'okha', name: 'Okha', nameRu: 'Оха', lat: 53.5739, lon: 142.947, priority: 4 },
    { code: 'nevelsk', name: 'Nevelsk', nameRu: 'Невельск', lat: 46.6733, lon: 141.855, priority: 5 },
    { code: 'poronaysk', name: 'Poronaysk', nameRu: 'Поронайск', lat: 49.2217, lon: 143.094, priority: 6 },
    { code: 'aleksandrovsk-sakhalinsky', name: 'Aleksandrovsk-Sakhalinsky', nameRu: 'Александровск-Сахалинский', lat: 50.8975, lon: 142.155, priority: 7 },
    { code: 'dolinsk', name: 'Dolinsk', nameRu: 'Долинск', lat: 47.3294, lon: 142.802, priority: 8 },
    { code: 'aniva', name: 'Aniva', nameRu: 'Анива', lat: 46.7147, lon: 142.528, priority: 9 },
    { code: 'uglegorsk', name: 'Uglegorsk', nameRu: 'Углегорск', lat: 49.0808, lon: 142.040, priority: 10 },
    { code: 'makharov', name: 'Makharov', nameRu: 'Макаров', lat: 48.6267, lon: 142.796, priority: 11 },
    { code: 'tomari', name: 'Tomari', nameRu: 'Томари', lat: 47.7656, lon: 142.070, priority: 12 },
    { code: 'kuriisk', name: 'Kurilsk', nameRu: 'Курильск', lat: 45.2267, lon: 147.877, priority: 13 },
  ];

  for (const city of cities) {
    await prisma.weatherCity.upsert({
      where: { cityCode: city.code },
      update: {},
      create: {
        cityCode: city.code,
        name: city.name,
        nameRu: city.nameRu,
        latitude: city.lat,
        longitude: city.lon,
        priority: city.priority,
        isActive: true,
      },
    });
  }

  console.log(`${cities.length} cities created`);

  // 3. Categories
  const categoryData = [
    { name: 'Общество', slug: 'obshchestvo', sortOrder: 1 },
    { name: 'Происшествия', slug: 'proisshestviya', sortOrder: 2 },
    { name: 'Экономика', slug: 'ekonomika', sortOrder: 3 },
    { name: 'Политика', slug: 'politika', sortOrder: 4 },
    { name: 'Спорт', slug: 'sport', sortOrder: 5 },
    { name: 'Культура', slug: 'kultura', sortOrder: 6 },
    { name: 'Транспорт', slug: 'transport', sortOrder: 7 },
    { name: 'ЖКХ', slug: 'zhkkh', sortOrder: 8 },
    { name: 'Природа', slug: 'priroda', sortOrder: 9 },
    { name: 'Образование', slug: 'obrazovanie', sortOrder: 10 },
    { name: 'Здравоохранение', slug: 'zdravookhranenie', sortOrder: 11 },
    { name: 'Технологии', slug: 'tekhnologii', sortOrder: 12 },
    { name: 'Туризм', slug: 'turizm', sortOrder: 13 },
    { name: 'Рыболовство', slug: 'rybolovstvo', sortOrder: 14 },
    { name: 'Энергетика', slug: 'energetika', sortOrder: 15 },
    { name: 'Сельское хозяйство', slug: 'selskoe-khozyaystvo', sortOrder: 16 },
    { name: 'Недвижимость', slug: 'nedvizhimost', type: 'ads' as const, sortOrder: 1 },
    { name: 'Квартиры', slug: 'kvartiry', type: 'ads' as const, sortOrder: 2 },
    { name: 'Дома', slug: 'doma', type: 'ads' as const, sortOrder: 3 },
    { name: 'Коммерческая', slug: 'kommercheskaya', type: 'ads' as const, sortOrder: 4 },
    { name: 'Кино', slug: 'kino', type: 'events' as const, sortOrder: 1 },
    { name: 'Театр', slug: 'teatr', type: 'events' as const, sortOrder: 2 },
    { name: 'Концерты', slug: 'kontserty', type: 'events' as const, sortOrder: 3 },
    { name: 'Выставки', slug: 'vystavki', type: 'events' as const, sortOrder: 4 },
    { name: 'Вакансии', slug: 'vacancies', type: 'ads' as const, sortOrder: 1 },
    { name: 'Резюме', slug: 'resumes', type: 'ads' as const, sortOrder: 2 },
    { name: 'Продажи', slug: 'sales', type: 'ads' as const, sortOrder: 3 },
    { name: 'Услуги', slug: 'services', type: 'ads' as const, sortOrder: 4 },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        type: (cat as any).type || 'news',
      },
    });
  }

  console.log(`${categoryData.length} categories created`);

  // 4. Billing tariffs
  const tariffs = [
    { name: 'Sakhcom+ Базовый', description: 'Базовый доступ к закрытым материалам', price: 299, interval: 'month' as const, features: ['10 премиум-статей в месяц', 'Без рекламы', 'Специальные проекты'] },
    { name: 'Sakhcom+ Расширенный', description: 'Полный доступ ко всем материалам', price: 599, interval: 'month' as const, features: ['Безлимитный доступ', 'Без рекламы', 'Эксклюзивные материалы', 'Приоритетная поддержка'] },
    { name: 'Sakhcom+ Годовой', description: 'Годовая подписка со скидкой', price: 4990, interval: 'year' as const, features: ['Всё из Расширенного', '2 месяца бесплатно', 'Подарок при оформлении'] },
  ];

  await prisma.billingTariff.createMany({
    data: tariffs.map((tariff) => ({
      name: tariff.name,
      description: tariff.description,
      price: tariff.price,
      interval: tariff.interval,
      features: tariff.features,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  console.log(`${tariffs.length} tariffs created`);

  // 5. Advertising placements
  const placements = [
    { name: 'Главный баннер (верх)', code: 'top-banner', zone: 'header', width: 728, height: 90, pricePerDay: 5000 },
    { name: 'Боковой баннер (правый)', code: 'sidebar-right', zone: 'sidebar', width: 300, height: 250, pricePerDay: 3000 },
    { name: 'Баннер в ленте новостей', code: 'news-feed', zone: 'content', width: 728, height: 90, pricePerDay: 4000 },
    { name: 'Мобильный баннер (верх)', code: 'mobile-top', zone: 'header', width: 320, height: 50, pricePerDay: 2000 },
    { name: 'Баннер в статье', code: 'article-inline', zone: 'content', width: 728, height: 90, pricePerDay: 3500 },
  ];

  for (const placement of placements) {
    await prisma.advertisingPlacement.upsert({
      where: { code: placement.code },
      update: {},
      create: placement,
    });
  }

  console.log(`${placements.length} advertising placements created`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
