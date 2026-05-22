import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Admin user (password managed by Supabase Auth)
  const adminEmails = ['from0lake@gmail.com', 'admin@rec-sakh.ru'];
  let admin = null;
  for (const email of adminEmails) {
    admin = await prisma.user.upsert({
      where: { email },
      update: { role: UserRole.admin, isEmailVerified: true },
      create: {
        email,
        name: email === 'from0lake@gmail.com' ? 'Владимир' : 'Администратор',
        role: UserRole.admin,
        isEmailVerified: true,
      },
    });

    await prisma.userSetting.upsert({
      where: { userId: admin.id },
      update: {},
      create: { userId: admin.id },
    });

    console.log('Admin user ready:', admin.email);
  }

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

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        type: ('type' in cat ? cat.type : 'news') as string,
      },
    });
    categoryMap[cat.slug] = created.id;
  }

  console.log(`${categoryData.length} categories created`);

  // 3a. Tags
  const tagData = [
    { name: 'Тема дня', slug: 'theme-day' },
    { name: 'Экология', slug: 'ekologiya' },
    { name: 'Транспорт', slug: 'transport' },
    { name: 'Строительство', slug: 'stroitelstvo' },
    { name: 'Благоустройство', slug: 'blagoustrojstvo' },
    { name: 'Коронавирус', slug: 'koronavirus' },
    { name: 'Отопление', slug: 'otoplenie' },
    { name: 'Ремонт дорог', slug: 'remont-dorog' },
    { name: 'Медицина', slug: 'meditsina' },
    { name: 'Образование', slug: 'obrazovanie' },
  ];

  const tagMap: Record<string, string> = {};
  for (const tag of tagData) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { name: tag.name, slug: tag.slug },
    });
    tagMap[tag.slug] = created.id;
  }

  console.log(`${tagData.length} tags created`);

  // 3b. Journalist user for articles
  const journalist = await prisma.user.upsert({
    where: { email: 'journalist@rec-sakh.ru' },
    update: {},
    create: {
      email: 'journalist@rec-sakh.ru',
      name: 'Анна Петрова',
      role: UserRole.journalist,
      isEmailVerified: true,
    },
  });

  await prisma.userSetting.upsert({
    where: { userId: journalist.id },
    update: {},
    create: { userId: journalist.id },
  });

  console.log('Journalist user created:', journalist.email);

  // 3c. News articles
  const obshchestvoId = categoryMap['obshchestvo']!;
  const proisshestviyaId = categoryMap['proisshestviya']!;
  const ekonomikaId = categoryMap['ekonomika']!;
  const transportId = categoryMap['transport']!;
  const kulturaId = categoryMap['kultura']!;
  const sportId = categoryMap['sport']!;
  const prirodaId = categoryMap['priroda']!;
  const zhkkhId = categoryMap['zhkkh']!;
  const zdravookhranenieId = categoryMap['zdravookhranenie']!;
  const obrazovanieId = categoryMap['obrazovanie']!;
  const tekhnologiiId = categoryMap['tekhnologii']!;
  const turizmId = categoryMap['turizm']!;

  const themeDayTagId = tagMap['theme-day']!;
  const ekologiyaTagId = tagMap['ekologiya']!;
  const transportTagId = tagMap['transport']!;

  const now = new Date();
  const day = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

  const newsArticles = [
    {
      title: 'На Сахалине стартовал новый туристический сезон: что ждёт гостей острова',
      slug: 'novyj-turisticheskij-sezon-sakhalin',
      lead: 'В 2026 году Сахалинская область планирует принять более 500 тысяч туристов. Рассказываем о новых маршрутах и мерах поддержки отрасли.',
      content: '<p>Губернатор Сахалинской области объявил о старте нового туристического сезона. В этом году регион ожидает значительный рост турпотока благодаря запуску новых авиарейсов и развитию инфраструктуры.</p><p>Особое внимание уделяется экологическому туризму: разработаны маршруты по Курильским островам, организованы морские прогулки к лежбищам сивучей.</p><p>Для гостей острова подготовлены специальные туристические пакеты, включающие проживание, питание и экскурсионную программу. Средний чек на тур выходного дня составляет 25–35 тысяч рублей на человека.</p>',
      categoryId: turizmId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 3420,
      commentsCount: 15,
      publishedAt: day(0),
    },
    {
      title: 'Снегоход в кювете: спасатели МЧС деблокировали пострадавшего в Долинском районе',
      slug: 'spasateli-deblokirovali-snegokhod-dolinsk',
      lead: 'В Долинском районе Сахалина спасатели вызволили мужчину из перевернувшегося снегохода. Пострадавший госпитализирован с переохлаждением.',
      content: '<p>Операция по спасению заняла около часа. Снегоход съехал в глубокий кювет на 14-м километре дороги Долинск — Стародубское. Водитель не справился с управлением на крутом повороте.</p><p>Бригада скорой помощи доставила мужчину в Долинскую ЦРБ. У пострадавшего диагностированы ушибы и лёгкое переохлаждение. Его жизни ничего не угрожает.</p><p>ГИБДД напоминает о необходимости соблюдения скоростного режима и использования защитной экипировки при управлении снегоходами.</p>',
      categoryId: proisshestviyaId!,
      city: 'Долинск',
      isUrgent: true,
      isPremium: false,
      viewsCount: 5870,
      commentsCount: 32,
      publishedAt: day(1),
    },
    {
      title: 'Цены на бензин на Сахалине: эксперты прогнозируют стабилизацию',
      slug: 'tseny-na-benzin-sakhalin-stabilizatsiya',
      lead: 'После двухмесячного роста стоимость автомобильного топлива на острове начала стабилизироваться. Разбираемся в причинах и прогнозах.',
      content: '<p>Стоимость бензина марки АИ-92 на заправках Сахалина достигла 58,5 рубля за литр, АИ-95 — 63,2 рубля. За последнюю неделю рост не превысил 0,3%, что свидетельствует о замедлении инфляционных процессов.</p><p>По данным регионального минэкономразвития, стабилизации удалось добиться благодаря увеличению объёмов поставок топлива и сдерживанию цен на НПЗ.</p><p>Эксперты прогнозируют, что до конца месяца цена на бензин не превысит 59 рублей за литр АИ-92 при условии сохранения текущей конъюнктуры рынка.</p>',
      categoryId: ekonomikaId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 4210,
      commentsCount: 48,
      publishedAt: day(1),
    },
    {
      title: 'Городская среда: в Южно-Сахалинске завершается благоустройство сквера у Дома культуры',
      slug: 'blagoustrojstvo-skvera-dk-yuzhno-sakhalinsk',
      lead: 'Новое общественное пространство появится в планировочном районе Луговое. В сквере установлены скамейки, урны и проведено освещение.',
      content: '<p>Работы по благоустройству сквера у Дома культуры «Родина» вышли на финишную прямую. Подрядчик завершает установку малых архитектурных форм и высадку зелёных насаждений.</p><p>В сквере появились пешеходные дорожки с твёрдым покрытием, современные светильники на солнечных батареях, детская игровая зона с безопасным резиновым покрытием.</p><p>Жители района неоднократно обращались в администрацию с просьбой привести территорию в порядок. Проект реализован в рамках программы «Формирование комфортной городской среды».</p>',
      categoryId: obshchestvoId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 2890,
      commentsCount: 21,
      publishedAt: day(2),
      tags: { connect: [{ id: themeDayTagId }] },
    },
    {
      title: 'Сборная Сахалина по дзюдо завоевала 5 медалей на дальневосточных соревнованиях',
      slug: 'sbornaya-sakhalina-dzyudo-5-medalej',
      lead: 'Спортсмены из Сахалинской области успешно выступили на чемпионате Дальневосточного федерального округа по дзюдо во Владивостоке.',
      content: '<p>В копилке сахалинской сборной — одно золото, два серебра и две бронзы. Золотую медаль завоевал Александр Ищенко в весовой категории до 73 кг.</p><p>Серебряные призёры — Мария Ким (до 57 кг) и Дмитрий Волков (до 81 кг). Бронзовыми медалистами стали Елена Соколова (до 63 кг) и Виктор Зайцев (до 90 кг).</p><p>Тренерский штаб отметил высокий уровень подготовки спортсменов и выразил уверенность в успешном выступлении на всероссийских соревнованиях в мае.</p>',
      categoryId: sportId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 1560,
      commentsCount: 8,
      publishedAt: day(2),
    },
    {
      title: 'Морской транспорт: паромную переправу Ванино — Холмск планируют модернизировать',
      slug: 'paromnaya-pereprava-vanino-kholmsk-modernizatsiya',
      lead: 'Правительство РФ выделило средства на обновление паромного флота и инфраструктуры порта Холмск. Модернизация начнётся в 2026 году.',
      content: '<p>На модернизацию паромной переправы Ванино — Холмск выделено 2,8 миллиарда рублей. Средства пойдут на строительство двух новых паромов ледового класса и реконструкцию причальных сооружений.</p><p>Действующие паромы «Сахалин-8» и «Сахалин-9» эксплуатируются более 30 лет и требуют замены. Новые суда смогут перевозить до 60 грузовых автомобилей и 200 пассажиров.</p><p>Реконструкция порта Холмск предусматривает углубление дна, замену причальных стенок и строительство современного терминала для пассажиров.</p>',
      categoryId: transportId!,
      city: 'Холмск',
      isUrgent: false,
      isPremium: true,
      viewsCount: 2340,
      commentsCount: 19,
      publishedAt: day(3),
      tags: { connect: [{ id: transportTagId }] },
    },
    {
      title: 'Театральная весна: на Сахалине стартует фестиваль «Антоновка»',
      slug: 'festival-antonovka-teatralnaya-vesna-sakhalin',
      lead: 'В Южно-Сахалинске открывается VII Межрегиональный театральный фестиваль «Антоновка». В программе — 15 спектаклей от коллективов Дальнего Востока.',
      content: '<p>Фестиваль продлится две недели. Свои постановки представят театры из Хабаровска, Владивостока, Благовещенска, Петропавловска-Камчатского и, конечно, Сахалина.</p><p>Откроет фестиваль спектакль «Вишнёвый сад» Чехов-центра в постановке московского режиссёра Ивана Комарова. Билеты раскуплены за неделю до премьеры.</p><p>Помимо конкурсной программы запланированы мастер-классы от ведущих театральных педагогов и творческие встречи с актёрами.</p>',
      categoryId: kulturaId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 3120,
      commentsCount: 24,
      publishedAt: day(3),
    },
    {
      title: 'Редкого японского журавля заметили на Кунашире: уникальные кадры',
      slug: 'redkij-yaponskij-zhuravl-kunashir',
      lead: 'Орнитологи зафиксировали на острове Кунашир японского (уссурийского) журавля — вид занесён в Красную книгу России.',
      content: '<p>Редкая птица была замечена в районе озера Горячее в кальдере вулкана Головнина. Японский журавль — один из самых крупных журавлей, его рост достигает 158 см, размах крыльев — до 250 см.</p><p>По словам орнитолога заповедника «Курильский» Сергея Иванова, это третья встреча с данным видом на Кунашире за последнее десятилетие, что говорит о возможном расширении ареала.</p><p>Специалисты ведут наблюдение за птицей, чтобы подтвердить гнездование. Учёные напоминают о недопустимости беспокойства редких видов.</p>',
      categoryId: prirodaId!,
      city: 'Кунашир',
      isUrgent: false,
      isPremium: false,
      viewsCount: 4890,
      commentsCount: 36,
      publishedAt: day(4),
      tags: { connect: [{ id: ekologiyaTagId }] },
    },
    {
      title: 'Сахалинская область вошла в топ-10 регионов по скорости интернета',
      slug: 'sakhalin-top10-skorost-interneta',
      lead: 'По итогам 2025 года Сахалинская область заняла 8-е место среди регионов России по скорости мобильного интернета.',
      content: '<p>Средняя скорость мобильного интернета на Сахалине составила 42,3 Мбит/с, что на 18% выше показателей предыдущего года. Исследование проводилось компанией «МегаФон» на основе данных своих абонентов.</p><p>Лидерами рейтинга стали Москва (78,2 Мбит/с), Санкт-Петербург (65,4 Мбит/с) и Московская область (51,7 Мбит/с). Замыкает десятку Новосибирская область (38,9 Мбит/с).</p><p>Представители оператора связывают рост с запуском дополнительных базовых станций стандарта LTE в отдалённых населённых пунктах острова.</p>',
      categoryId: tekhnologiiId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 2150,
      commentsCount: 12,
      publishedAt: day(4),
    },
    {
      title: 'Отопительный сезон завершается: когда отключат тепло в муниципалитетах Сахалина',
      slug: 'zavershenie-otopitelnogo-sezona-sakhalin',
      lead: 'Постановления о завершении отопительного сезона подписаны в большинстве районов Сахалинской области. Сводный график отключения тепла.',
      content: '<p>Отопительный сезон в Сахалинской области завершается согласно графику. Первыми тепло отключат в Холмском и Невельском районах — уже на этой неделе.</p><p>В Южно-Сахалинске отопительный сезон завершится 25 мая. Соответствующее постановление подписал мэр города. В Корсакове и Долинске тепло отключат до конца месяца.</p><p>В северных районах — Охе, Ногликах, Александровске-Сахалинском — отопительный сезон продлится до начала июня из-за более низких среднесуточных температур.</p>',
      categoryId: zhkkhId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 6750,
      commentsCount: 54,
      publishedAt: day(5),
    },
    {
      title: 'На Курилах открывается новый рыбоперерабатывающий завод',
      slug: 'novyj-rybopererabatyvayushchij-zavod-kurily',
      lead: 'На острове Итуруп запускается предприятие полного цикла по переработке лососёвых пород рыб. Инвестиции превысили 1,5 млрд рублей.',
      content: '<p>Новый завод расположен в селе Рейдово на побережье Охотского моря. Его мощность — до 200 тонн рыбы в сутки. Предприятие оснащено современным японским оборудованием.</p><p>Завод будет выпускать мороженую продукцию, филе, икру и консервы. Большая часть продукции пойдёт на экспорт в страны АТР.</p><p>На предприятии создано 120 рабочих мест для местных жителей. Средняя заработная плата составит 80 тысяч рублей.</p>',
      categoryId: ekonomikaId!,
      city: 'Курильск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 1890,
      commentsCount: 14,
      publishedAt: day(5),
    },
    {
      title: 'Дорога Южно-Сахалинск — Оха: ремонт участка завершат досрочно',
      slug: 'remont-dorogi-yuzhno-sakhalinsk-okha-dosrochno',
      lead: 'Подрядчик обещает завершить ремонт 15-километрового участка трассы на две недели раньше контрактных сроков.',
      content: '<p>Речь идёт об участке с 45 по 60 километр автодороги Южно-Сахалинск — Оха. Дорожники уложили верхний слой асфальтобетона и приступили к укреплению обочин.</p><p>Работы ведутся в рамках национального проекта «Безопасные качественные дороги». На ремонт выделено 380 миллионов рублей.</p><p>После завершения работ проезд по всему участку будет открыт без ограничений. Дорожники просят водителей соблюдать временные знаки ограничения скорости.</p>',
      categoryId: transportId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 3120,
      commentsCount: 27,
      publishedAt: day(6),
      tags: { connect: [{ id: transportTagId }] },
    },
    {
      title: 'В Южно-Сахалинске открылась запись в первые классы: что нужно знать родителям',
      slug: 'zapis-v-pervye-klassy-yuzhno-sakhalinsk',
      lead: 'Приём заявлений в первые классы стартовал в школах областного центра. В этом году за парты сядут более 4 тысяч первоклассников.',
      content: '<p>Запись началась 1 апреля. Подать заявление можно через портал «Госуслуги», МФЦ или непосредственно в школе. В Южно-Сахалинске работает 28 общеобразовательных школ.</p><p>В новом микрорайоне «Горизонт» открывается школа № 35 на 1100 мест. Это позволит разгрузить близлежащие учебные заведения, где обучение велось в две смены.</p><p>Родителям будущих первоклассников рекомендуют заранее ознакомиться с перечнем документов и закреплёнными за школами территориями.</p>',
      categoryId: obrazovanieId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 5430,
      commentsCount: 41,
      publishedAt: day(6),
    },
    {
      title: 'Сахалинские врачи спасли пациента с редким диагнозом',
      slug: 'sakhalinskie-vrachi-spasli-redkij-diagnoz',
      lead: 'Хирурги Сахалинской областной больницы провели сложнейшую операцию на сердце 72-летнему пациенту с аневризмой аорты.',
      content: '<p>Уникальность операции заключалась в том, что аневризма имела сложную форму и располагалась в труднодоступном месте. Операция длилась 6 часов и прошла успешно.</p><p>В бригаду входили сосудистый хирург, кардиохирург и анестезиолог. Пациент уже переведён из реанимации в общую палату и идёт на поправку.</p><p>Главный врач областной больницы отметил, что подобные операции теперь будут проводиться на Сахалине регулярно, без необходимости выезжать в Москву.</p>',
      categoryId: zdravookhranenieId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 4780,
      commentsCount: 33,
      publishedAt: day(7),
    },
    {
      title: 'Сахалинские школьники стали призёрами Всероссийской олимпиады по информатике',
      slug: 'shkolniki-prizery-olimpiady-informatika',
      lead: 'Трое учащихся из Южно-Сахалинска и Корсакова вернулись с наградами из «Сириуса». В копилке — одно золото и две серебряные медали.',
      content: '<p>Заключительный этап Всероссийской олимпиады школьников по информатике прошёл в образовательном центре «Сириус» в Сочи. В нём приняли участие более 300 школьников из 65 регионов России.</p><p>Золото завоевал десятиклассник лицея № 2 Южно-Сахалинска Артём Ковалёв. Серебряные медали — у Алисы Медведевой из гимназии № 1 и Ивана Смирнова из школы № 6 Корсакова.</p><p>Призёры смогут поступить в ведущие IT-вузы страны без вступительных испытаний.</p>',
      categoryId: obrazovanieId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 1670,
      commentsCount: 9,
      publishedAt: day(7),
    },
    {
      title: 'Суд приговорил браконьеров к крупным штрафам за вылов краба',
      slug: 'prigovor-brakoneram-krab-sakhalin',
      lead: 'Холмский городской суд вынес приговор группе браконьеров, незаконно выловивших более 2 тонн камчатского краба.',
      content: '<p>Браконьеры действовали в акватории Татарского пролива в течение нескольких месяцев. Ущерб водным биоресурсам оценён в 12 миллионов рублей.</p><p>Суд назначил штрафы на общую сумму 2,5 миллиона рублей, а также конфисковал судно и орудия лова. Двое фигурантов получили условные сроки.</p><p>Пограничное управление ФСБ напоминает, что вылов краба без лицензии является уголовным преступлением и наказывается штрафом до 1 млн рублей.</p>',
      categoryId: proisshestviyaId!,
      city: 'Холмск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 5210,
      commentsCount: 43,
      publishedAt: day(8),
    },
    {
      title: 'Энергетики завершили строительство новой подстанции на севере Сахалина',
      slug: 'novaya-podstantsiya-sever-sakhalina',
      lead: 'Подстанция 110 кВ «Ноглики-2» обеспечит стабильное электроснабжение северных районов острова и нефтегазовых месторождений.',
      content: '<p>Объект построен в рамках инвестиционной программы «Сахалинэнерго». Мощность подстанции — 50 МВА. Она оснащена современным оборудованием российского и белорусского производства.</p><p>Ввод подстанции позволит подключить к централизованному электроснабжению несколько удалённых населённых пунктов, а также снизить риск аварийных отключений в период пиковых нагрузок.</p><p>Стоимость проекта составила 890 миллионов рублей. Работы велись в течение полутора лет.</p>',
      categoryId: ekonomikaId!,
      city: 'Ноглики',
      isUrgent: false,
      isPremium: true,
      viewsCount: 1230,
      commentsCount: 7,
      publishedAt: day(8),
    },
    {
      title: 'В Южно-Сахалинске выбрали подрядчика для строительства нового моста через реку Рогатку',
      slug: 'novyj-most-cherez-reku-rogatku',
      lead: 'Администрация города определила победителя тендера на строительство моста, который соединит центр города с северными микрорайонами.',
      content: '<p>Победителем признано ООО «Сахалинстрой». Контракт заключён на сумму 1,2 миллиарда рублей. Мост будет четырёхполосным с тротуарами и велодорожкой.</p><p>Срок сдачи объекта — декабрь 2027 года. Проект предусматривает развязку на пересечении с проспектом Мира и организацию съездов к новому микрорайону.</p><p>Новый мост позволит разгрузить существующий путепровод на улице Ленина, который ежедневно пропускает более 40 тысяч автомобилей.</p>',
      categoryId: obshchestvoId!,
      city: 'Южно-Сахалинск',
      isUrgent: false,
      isPremium: false,
      viewsCount: 4580,
      commentsCount: 38,
      publishedAt: day(9),
    },
  ];

  for (const article of newsArticles) {
    const { tags, ...data } = article;
    await prisma.newsArticle.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        status: 'published' as const,
        authorId: journalist.id,
        publishedAt: data.publishedAt,
        readingTimeMinutes: Math.ceil(data.content.length / 1000),
        tags: tags ? { create: tags.connect.map((t: { id: string }) => ({ tagId: t.id })) } : undefined,
      },
    });
  }

  console.log(`${newsArticles.length} news articles created`);

  // 3d. Events
  const events = [
    {
      title: 'Концерт группы «Мумий Тролль»',
      description: 'Легендарная российская рок-группа выступит в ККЗ «Октябрь» с новой программой. Гостей ждут как новые хиты, так и проверенные временем композиции.',
      shortDescription: 'Большой концерт легендарной группы',
      categoryId: categoryMap['kontserty']!,
      city: 'Южно-Сахалинск',
      venueName: 'ККЗ «Октябрь»',
      venueAddress: 'ул. Коммунистический проспект, 45',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      isFree: false,
      price: 2500,
    },
    {
      title: 'Спектакль «Чайка» в Чехов-центре',
      description: 'Классическая постановка пьесы А.П. Чехова. Режиссёр — заслуженный деятель искусств РФ Михаил Бычков.',
      shortDescription: 'Премьера нового сезона',
      categoryId: categoryMap['teatr']!,
      city: 'Южно-Сахалинск',
      venueName: 'Чехов-центр',
      venueAddress: 'ул. Чехова, 72',
      startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
      isFree: false,
      price: 1500,
    },
    {
      title: 'Выставка «Сахалин в акварелях»',
      description: 'Выставка работ сахалинских художников, посвящённая природе и городам острова. Более 50 работ в технике акварели.',
      shortDescription: 'Пейзажи Сахалина в акварельной технике',
      categoryId: categoryMap['vystavki']!,
      city: 'Южно-Сахалинск',
      venueName: 'Сахалинский областной художественный музей',
      venueAddress: 'ул. Ленина, 137',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
      isFree: true,
    },
    {
      title: 'Фестиваль японской культуры',
      description: 'Ежегодный фестиваль, посвящённый культуре Японии. В программе: мастер-классы по каллиграфии, чайная церемония, показ аниме и концерт на традиционных инструментах.',
      shortDescription: 'Погружение в культуру Страны восходящего солнца',
      categoryId: categoryMap['kino']!,
      city: 'Южно-Сахалинск',
      venueName: 'Городской парк культуры и отдыха им. Гагарина',
      venueAddress: 'ул. Детская, 1',
      startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      isFree: true,
    },
    {
      title: 'Ночь музеев в историческом парке «Россия — моя история»',
      description: 'Ежегодная акция с бесплатным посещением всех экспозиций, квестами и интерактивными программами для всей семьи.',
      shortDescription: 'Бесплатное посещение и специальная программа',
      categoryId: categoryMap['vystavki']!,
      city: 'Южно-Сахалинск',
      venueName: 'Исторический парк «Россия — моя история»',
      venueAddress: 'ул. Священномученика Илариона Троицкого, 3',
      startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      isFree: true,
    },
  ];

  // Clear existing events and jobs for idempotent re-seed
  await prisma.event.deleteMany({});
  for (const event of events) {
    await prisma.event.create({
      data: {
        ...event,
        organizerId: admin.id,
        status: 'published',
      },
    });
  }

  console.log(`${events.length} events created`);

  // 3e. Jobs
  const jobs = [
    {
      title: 'Водитель автобуса',
      description: 'МУП «Транспортная компания» приглашает на работу водителей автобусов с опытом работы от 3 лет. Работа на новых автобусах ЛиАЗ, полный соцпакет.',
      categoryId: categoryMap['vacancies']!,
      city: 'Южно-Сахалинск',
      salaryMin: 70000,
      salaryMax: 90000,
      companyName: 'МУП «Транспортная компания»',
      schedule: 'полный день',
      experience: 'от 3 лет',
      type: 'vacancy' as const,
    },
    {
      title: 'Инженер-строитель',
      description: 'Строительная компания «Сахалинстрой» ищет инженера для контроля качества строительных работ. Высшее профильное образование обязательно.',
      categoryId: categoryMap['vacancies']!,
      city: 'Южно-Сахалинск',
      salaryMin: 90000,
      salaryMax: 120000,
      companyName: 'ООО «Сахалинстрой»',
      schedule: 'полный день',
      experience: 'от 1 года',
      type: 'vacancy' as const,
    },
    {
      title: 'Медицинская сестра',
      description: 'Сахалинская областная больница приглашает медицинских сестёр в хирургическое отделение. Сменный график, льготы медработникам.',
      categoryId: categoryMap['vacancies']!,
      city: 'Южно-Сахалинск',
      salaryMin: 55000,
      salaryMax: 70000,
      companyName: 'ГБУЗ «Сахалинская областная больница»',
      schedule: 'сменный',
      experience: 'от 1 года',
      type: 'vacancy' as const,
    },
    {
      title: 'Продавец-кассир',
      description: 'Сеть магазинов «Самбери» приглашает продавцов-кассиров. Обучение за счёт компании, гибкий график, скидка сотрудникам 10%.',
      categoryId: categoryMap['vacancies']!,
      city: 'Южно-Сахалинск',
      salaryMin: 40000,
      salaryMax: 55000,
      companyName: 'ГК «Самбери»',
      schedule: 'сменный',
      experience: 'без опыта',
      type: 'vacancy' as const,
    },
    {
      title: 'Учитель информатики',
      description: 'Школа № 35 (новый микрорайон «Горизонт») приглашает учителя информатики. Возможно классное руководство, методическая поддержка.',
      categoryId: categoryMap['vacancies']!,
      city: 'Южно-Сахалинск',
      salaryMin: 55000,
      salaryMax: 75000,
      companyName: 'МАОУ СОШ № 35',
      schedule: 'полный день',
      experience: 'от 1 года',
      type: 'vacancy' as const,
    },
  ];

  await prisma.job.deleteMany({});
  for (const job of jobs) {
    await prisma.job.create({
      data: {
        ...job,
        userId: admin.id,
        currency: 'RUB',
        contacts: '{}',
        status: 'active',
      },
    });
  }

  console.log(`${jobs.length} jobs created`);

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

  // 6. CASL Permissions
  const permDefs = [
    { action: 'manage', subject: 'all' },
    { action: 'read', subject: 'User' },
    { action: 'update', subject: 'User' },
    { action: 'create', subject: 'News' },
    { action: 'read', subject: 'News' },
    { action: 'update', subject: 'News' },
    { action: 'delete', subject: 'News' },
    { action: 'create', subject: 'Comment' },
    { action: 'read', subject: 'Comment' },
    { action: 'update', subject: 'Comment' },
    { action: 'delete', subject: 'Comment' },
    { action: 'create', subject: 'Category' },
    { action: 'read', subject: 'Category' },
    { action: 'update', subject: 'Category' },
    { action: 'delete', subject: 'Category' },
    { action: 'create', subject: 'Tag' },
    { action: 'read', subject: 'Tag' },
    { action: 'update', subject: 'Tag' },
    { action: 'delete', subject: 'Tag' },
    { action: 'create', subject: 'Event' },
    { action: 'read', subject: 'Event' },
    { action: 'update', subject: 'Event' },
    { action: 'delete', subject: 'Event' },
    { action: 'create', subject: 'Ad' },
    { action: 'read', subject: 'Ad' },
    { action: 'update', subject: 'Ad' },
    { action: 'delete', subject: 'Ad' },
    { action: 'create', subject: 'Job' },
    { action: 'read', subject: 'Job' },
    { action: 'update', subject: 'Job' },
    { action: 'delete', subject: 'Job' },
    { action: 'create', subject: 'Realty' },
    { action: 'read', subject: 'Realty' },
    { action: 'update', subject: 'Realty' },
    { action: 'delete', subject: 'Realty' },
    { action: 'create', subject: 'Media' },
    { action: 'read', subject: 'Media' },
    { action: 'update', subject: 'Media' },
    { action: 'delete', subject: 'Media' },
    { action: 'read', subject: 'Billing' },
    { action: 'update', subject: 'Billing' },
    { action: 'read', subject: 'Settings' },
    { action: 'update', subject: 'Settings' },
    { action: 'create', subject: 'Staff' },
    { action: 'read', subject: 'Staff' },
    { action: 'update', subject: 'Staff' },
    { action: 'delete', subject: 'Staff' },
  ];

  const permMap: Record<string, string> = {};
  for (const p of permDefs) {
    const created = await prisma.permission.upsert({
      where: { action_subject: { action: p.action, subject: p.subject } },
      update: {},
      create: p,
    });
    permMap[`${p.action}:${p.subject}`] = created.id;
  }

  const p = (action: string, subject: string) => permMap[`${action}:${subject}`];

  const guestPerms = [
    p('read', 'News'), p('read', 'Comment'), p('read', 'Event'),
    p('read', 'Ad'), p('read', 'Job'), p('read', 'Realty'),
    p('read', 'Category'), p('read', 'Tag'),
  ];
  const userPerms = [
    ...guestPerms,
    p('read', 'User'), p('update', 'User'),
    p('create', 'Comment'), p('create', 'Event'),
    p('create', 'Ad'), p('create', 'Job'), p('create', 'Realty'),
    p('create', 'Media'), p('read', 'Media'),
  ];
  const journalistPerms = [
    ...userPerms,
    p('create', 'News'), p('update', 'News'), p('delete', 'News'),
  ];
  const proofreaderPerms = [
    ...userPerms,
    p('read', 'News'), p('update', 'News'), p('read', 'Billing'),
  ];
  const editorPerms = [
    ...journalistPerms,
    p('create', 'Category'), p('update', 'Category'), p('delete', 'Category'),
    p('create', 'Tag'), p('update', 'Tag'), p('delete', 'Tag'),
    p('update', 'Comment'), p('delete', 'Comment'),
    p('update', 'Media'), p('delete', 'Media'),
  ];
  const chiefEditorPerms = [
    ...editorPerms,
    p('create', 'Staff'), p('read', 'Staff'), p('update', 'Staff'), p('delete', 'Staff'),
    p('read', 'Settings'),
  ];
  const moderatorPerms = [
    ...userPerms,
    p('update', 'Comment'), p('delete', 'Comment'),
    p('read', 'User'), p('read', 'Billing'),
  ];
  const adminPerms = [p('manage', 'all')];
  const superadminPerms = [
    p('manage', 'all'),
    p('create', 'Staff'), p('read', 'Staff'), p('update', 'Staff'), p('delete', 'Staff'),
    p('read', 'Settings'), p('update', 'Settings'),
    p('read', 'Billing'), p('update', 'Billing'),
  ];

  const rolePerms: { role: UserRole; permissionIds: string[] }[] = [
    { role: UserRole.guest, permissionIds: guestPerms },
    { role: UserRole.user, permissionIds: userPerms },
    { role: UserRole.journalist, permissionIds: journalistPerms },
    { role: UserRole.proofreader, permissionIds: proofreaderPerms },
    { role: UserRole.editor, permissionIds: editorPerms },
    { role: UserRole.chief_editor, permissionIds: chiefEditorPerms },
    { role: UserRole.moderator, permissionIds: moderatorPerms },
    { role: UserRole.admin, permissionIds: adminPerms },
    { role: UserRole.superadmin, permissionIds: superadminPerms },
  ];

  for (const rp of rolePerms) {
    await prisma.rolePermission.deleteMany({ where: { role: rp.role } });
    for (const permId of rp.permissionIds) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: rp.role, permissionId: permId } },
        update: {},
        create: { role: rp.role, permissionId: permId },
      });
    }
  }

  console.log(`${permDefs.length} permissions and ${rolePerms.length} role mappings created`);
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
