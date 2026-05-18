export interface AdminStats {
  uptime: string;
  cpuLoad: number;
  errors500: number;
  apiResponseTime: number;
  usersOnline: number;
}

export interface RecentAction {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'editor';
  status: 'active' | 'blocked' | 'pending';
  city: string;
  registeredAt: string;
  adsCount: number;
  commentsCount: number;
}

export interface AdminStaff {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'vacation' | 'sick' | 'offline';
  articlesPerWeek: number;
  hiredAt: string;
  avatar: string;
}

export interface StaffSchedule {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shift: 'morning' | 'day' | 'night';
}

export interface PermissionMatrix {
  section: string;
  roles: Record<string, boolean>;
}

export interface ModerationReport {
  id: string;
  contentType: string;
  reason: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ModerationRule {
  id: string;
  rule: string;
  pattern: string;
  action: 'block' | 'flag' | 'approve';
  priority: number;
  status: 'active' | 'inactive';
}

export interface AdPlacement {
  id: string;
  name: string;
  zone: string;
  dimensions: string;
  pricePerDay: number;
  status: 'active' | 'inactive';
}

export interface AdCampaign {
  id: string;
  name: string;
  client: string;
  placement: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  status: 'active' | 'paused' | 'completed';
}

export interface Transaction {
  id: string;
  date: string;
  user: string;
  type: 'payment' | 'refund' | 'withdrawal';
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
}

export interface Tariff {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

export interface SystemHealth {
  redis: { status: string; memory: string; hitRate: number };
  queue: { pending: number; processing: number; failed: number };
  search: { status: string; documents: number; lastIndexed: string };
  media: { total: string; used: string; files: number };
}

export const adminStats: AdminStats = {
  uptime: '14д 7ч 32м',
  cpuLoad: 42,
  errors500: 3,
  apiResponseTime: 187,
  usersOnline: 1247,
};

export const recentActions: RecentAction[] = [
  { id: 'a1', user: 'Александр Иванов', action: 'Заблокировал пользователя', target: 'ivan_1985', timestamp: '2 мин назад' },
  { id: 'a2', user: 'Елена Соколова', action: 'Опубликовала новость', target: 'Штормовое предупреждение', timestamp: '15 мин назад' },
  { id: 'a3', user: 'Анна Кузнецова', action: 'Отредактировала статью', target: 'Новый ТЦ в Южном', timestamp: '34 мин назад' },
  { id: 'a4', user: 'Сергей Новиков', action: 'Одобрил комментарий', target: 'Матч Сахалин — Чита', timestamp: '1 час назад' },
  { id: 'a5', user: 'Дмитрий Волков', action: 'Загрузил медиа', target: '15 фото с места ДТП', timestamp: '1 час назад' },
  { id: 'a6', user: 'Администратор', action: 'Очистил кэш', target: 'Redis cache', timestamp: '2 часа назад' },
  { id: 'a7', user: 'Мария Соколова', action: 'Создала рубрику', target: 'Экология', timestamp: '3 часа назад' },
  { id: 'a8', user: 'Александр Иванов', action: 'Изменил права', target: 'Пользователь: petrov@mail.ru', timestamp: '4 часа назад' },
  { id: 'a9', user: 'Система', action: 'Авто-модерация', target: 'Заблокировано 2 комментария', timestamp: '5 часов назад' },
  { id: 'a10', user: 'Елена Соколова', action: 'Запустила рассылку', target: 'Новости недели', timestamp: '6 часов назад' },
];

export const alerts: Alert[] = [
  { id: 'al1', type: 'critical', message: 'Redis достиг 85% памяти. Требуется очистка.', timestamp: '30 мин назад' },
  { id: 'al2', type: 'warning', message: 'Очередь рассылок переполнена (120 задач).', timestamp: '1 час назад' },
  { id: 'al3', type: 'critical', message: 'Поисковый индекс устарел на 3 часа.', timestamp: '2 часа назад' },
  { id: 'al4', type: 'info', message: 'Обновление системы: версия 2.4.1 доступна.', timestamp: '1 день назад' },
];

export const adminUsers: AdminUser[] = [
  { id: 'u1', name: 'Алексей Морозов', email: 'alexey@mail.ru', role: 'user', status: 'active', city: 'Южно-Сахалинск', registeredAt: '2024-03-15', adsCount: 3, commentsCount: 47 },
  { id: 'u2', name: 'Марина Ким', email: 'marina@mail.ru', role: 'user', status: 'active', city: 'Корсаков', registeredAt: '2024-06-20', adsCount: 1, commentsCount: 12 },
  { id: 'u3', name: 'Иван Петрович', email: 'ivan_p@yandex.ru', role: 'user', status: 'active', city: 'Оха', registeredAt: '2024-01-10', adsCount: 5, commentsCount: 89 },
  { id: 'u4', name: 'Олег Смирнов', email: 'oleg@list.ru', role: 'moderator', status: 'active', city: 'Южно-Сахалинск', registeredAt: '2023-11-05', adsCount: 0, commentsCount: 234 },
  { id: 'u5', name: 'Татьяна Волкова', email: 'tanya@inbox.ru', role: 'editor', status: 'active', city: 'Холмск', registeredAt: '2023-08-18', adsCount: 2, commentsCount: 512 },
  { id: 'u6', name: 'Наталья Соколова', email: 'nata@mail.ru', role: 'user', status: 'blocked', city: 'Невельск', registeredAt: '2025-02-28', adsCount: 0, commentsCount: 4 },
  { id: 'u7', name: 'Дмитрий Козлов', email: 'dima@yandex.ru', role: 'user', status: 'active', city: 'Поронайск', registeredAt: '2024-09-12', adsCount: 7, commentsCount: 156 },
  { id: 'u8', name: 'Спортивный фанат', email: 'fan@mail.ru', role: 'user', status: 'active', city: 'Южно-Сахалинск', registeredAt: '2023-12-01', adsCount: 0, commentsCount: 892 },
  { id: 'u9', name: 'Сергей Иванов', email: 'sergey@list.ru', role: 'admin', status: 'active', city: 'Южно-Сахалинск', registeredAt: '2022-06-15', adsCount: 0, commentsCount: 1567 },
  { id: 'u10', name: 'Ольга Павлова', email: 'olga@inbox.ru', role: 'user', status: 'pending', city: 'Тымовское', registeredAt: '2026-05-10', adsCount: 0, commentsCount: 0 },
];

export const adminStaff: AdminStaff[] = [
  { id: 's1', name: 'Анна Кузнецова', role: 'Корреспондент', status: 'active', articlesPerWeek: 7, hiredAt: '2023-06-01', avatar: '' },
  { id: 's2', name: 'Иван Петров', role: 'Спецкор', status: 'active', articlesPerWeek: 5, hiredAt: '2022-09-15', avatar: '' },
  { id: 's3', name: 'Мария Соколова', role: 'Редактор', status: 'active', articlesPerWeek: 3, hiredAt: '2021-04-10', avatar: '' },
  { id: 's4', name: 'Дмитрий Волков', role: 'Фотокор', status: 'vacation', articlesPerWeek: 0, hiredAt: '2023-11-20', avatar: '' },
  { id: 's5', name: 'Елена Морозова', role: 'Обозреватель', status: 'active', articlesPerWeek: 4, hiredAt: '2022-01-05', avatar: '' },
];

export const staffSchedule: StaffSchedule[] = [
  { id: 'sch1', staffId: 's1', staffName: 'Анна Кузнецова', date: '16 мая', shift: 'day' },
  { id: 'sch2', staffId: 's2', staffName: 'Иван Петров', date: '16 мая', shift: 'morning' },
  { id: 'sch3', staffId: 's3', staffName: 'Мария Соколова', date: '16 мая', shift: 'day' },
  { id: 'sch4', staffId: 's5', staffName: 'Елена Морозова', date: '16 мая', shift: 'night' },
  { id: 'sch5', staffId: 's1', staffName: 'Анна Кузнецова', date: '17 мая', shift: 'morning' },
  { id: 'sch6', staffId: 's2', staffName: 'Иван Петров', date: '17 мая', shift: 'day' },
];

export const permissionMatrix: PermissionMatrix[] = [
  { section: 'Новости', roles: { admin: true, editor: true, moderator: false, user: false } },
  { section: 'Комментарии', roles: { admin: true, editor: true, moderator: true, user: false } },
  { section: 'Рубрики', roles: { admin: true, editor: true, moderator: false, user: false } },
  { section: 'Пользователи', roles: { admin: true, editor: false, moderator: true, user: false } },
  { section: 'Реклама', roles: { admin: true, editor: false, moderator: false, user: false } },
  { section: 'Настройки', roles: { admin: true, editor: false, moderator: false, user: false } },
  { section: 'Рассылки', roles: { admin: true, editor: true, moderator: false, user: false } },
  { section: 'Медиа', roles: { admin: true, editor: true, moderator: true, user: false } },
];

export const moderationQueue: ModerationReport[] = [
  { id: 'm1', contentType: 'Комментарий', reason: 'Оскорбления', author: 'Аноним 2026', status: 'pending', createdAt: '10 мин назад' },
  { id: 'm2', contentType: 'Новость', reason: 'Фейк-ньюс', author: 'Иван Петрович', status: 'pending', createdAt: '25 мин назад' },
  { id: 'm3', contentType: 'Объявление', reason: 'Мошенничество', author: 'Сергей К.', status: 'pending', createdAt: '1 час назад' },
  { id: 'm4', contentType: 'Комментарий', reason: 'Спам', author: 'Рекламный бот', status: 'pending', createdAt: '2 часа назад' },
  { id: 'm5', contentType: 'Пользователь', reason: 'Фейковый аккаунт', author: 'Система', status: 'pending', createdAt: '3 часа назад' },
];

export const moderationRules: ModerationRule[] = [
  { id: 'r1', rule: 'Мат-фильтр', pattern: 'регулярка мата', action: 'block', priority: 1, status: 'active' },
  { id: 'r2', rule: 'Спам-фильтр', pattern: 'ссылки >3', action: 'flag', priority: 2, status: 'active' },
  { id: 'r3', rule: 'Капс-фильтр', pattern: '>50% ЗАГЛАВНЫХ', action: 'flag', priority: 3, status: 'active' },
  { id: 'r4', rule: 'Повторы', pattern: 'одинаковый текст', action: 'block', priority: 2, status: 'inactive' },
];

export const adPlacements: AdPlacement[] = [
  { id: 'ap1', name: 'Баннер на главной', zone: 'Хидер', dimensions: '728×90', pricePerDay: 5000, status: 'active' },
  { id: 'ap2', name: 'Сайдбар справа', zone: 'Сайдбар', dimensions: '300×250', pricePerDay: 3000, status: 'active' },
  { id: 'ap3', name: 'Внутри новости', zone: 'Контент', dimensions: '468×60', pricePerDay: 2000, status: 'active' },
  { id: 'ap4', name: 'Футер', zone: 'Подвал', dimensions: '970×90', pricePerDay: 4000, status: 'inactive' },
  { id: 'ap5', name: 'Мобильный баннер', zone: 'Мобайл', dimensions: '320×100', pricePerDay: 1500, status: 'active' },
];

export const adCampaigns: AdCampaign[] = [
  { id: 'c1', name: 'Лето на Сахалине', client: 'Турагентство "Остров"', placement: 'Баннер на главной', budget: 150000, spent: 82000, impressions: 245000, clicks: 3200, ctr: 1.31, status: 'active' },
  { id: 'c2', name: 'Новый ТЦ', client: 'ТЦ "Остров"', placement: 'Сайдбар справа', budget: 200000, spent: 200000, impressions: 410000, clicks: 5100, ctr: 1.24, status: 'completed' },
  { id: 'c3', name: 'Автосалон', client: 'Авто-Сити', placement: 'Внутри новости', budget: 80000, spent: 35000, impressions: 120000, clicks: 980, ctr: 0.82, status: 'paused' },
];

export const transactions: Transaction[] = [
  { id: 't1', date: '2026-05-16', user: 'Алексей Морозов', type: 'payment', amount: 5000, method: 'Карта', status: 'success' },
  { id: 't2', date: '2026-05-16', user: 'Марина Ким', type: 'payment', amount: 1500, method: 'СБП', status: 'success' },
  { id: 't3', date: '2026-05-15', user: 'Олег Смирнов', type: 'payment', amount: 12000, method: 'Карта', status: 'success' },
  { id: 't4', date: '2026-05-15', user: 'Иван Петрович', type: 'refund', amount: 3000, method: 'СБП', status: 'success' },
  { id: 't5', date: '2026-05-14', user: 'Дмитрий Козлов', type: 'payment', amount: 7500, method: 'Карта', status: 'pending' },
  { id: 't6', date: '2026-05-14', user: 'Татьяна Волкова', type: 'withdrawal', amount: 25000, method: 'Счёт', status: 'pending' },
  { id: 't7', date: '2026-05-13', user: 'Наталья Соколова', type: 'payment', amount: 1000, method: 'СБП', status: 'failed' },
  { id: 't8', date: '2026-05-13', user: 'Спортивный фанат', type: 'payment', amount: 3000, method: 'Карта', status: 'success' },
];

export const tariffs: Tariff[] = [
  { id: 'tr1', name: 'Базовый', price: 0, interval: 'месяц', features: ['5 объявлений', 'Комментарии', 'Личный кабинет'] },
  { id: 'tr2', name: 'Стандарт', price: 990, interval: 'месяц', features: ['25 объявлений', 'Продвижение на 3 дня', 'Статистика', 'Приоритетная поддержка'] },
  { id: 'tr3', name: 'Бизнес', price: 2990, interval: 'месяц', features: ['100 объявлений', 'Продвижение на 7 дней', 'Расширенная статистика', 'API-доступ', 'VIP-поддержка 24/7'] },
];

export const systemHealth: SystemHealth = {
  redis: { status: 'healthy', memory: '1.2 GB / 2 GB', hitRate: 94 },
  queue: { pending: 45, processing: 3, failed: 2 },
  search: { status: 'degraded', documents: 28450, lastIndexed: '3 часа назад' },
  media: { total: '50 GB', used: '32 GB', files: 12450 },
};

export const sakhalinCities = [
  'Южно-Сахалинск', 'Корсаков', 'Оха', 'Невельск', 'Холмск',
  'Поронайск', 'Долинск', 'Анива', 'Смирных', 'Томари',
  'Углегорск', 'Александровск-Сахалинский', 'Тымовское',
];

export const securityLogs = [
  { id: 'sec1', event: 'Неудачная попытка входа', user: 'admin@rec-sakh.ru', ip: '185.234.12.45', timestamp: '10 мин назад' },
  { id: 'sec2', event: 'Неудачная попытка входа', user: 'root', ip: '91.123.45.67', timestamp: '1 час назад' },
  { id: 'sec3', event: 'Блокировка IP', user: '—', ip: '185.234.12.45', timestamp: '5 мин назад' },
  { id: 'sec4', event: 'Смена пароля', user: 'alexey@mail.ru', ip: '95.24.68.12', timestamp: '3 часа назад' },
  { id: 'sec5', event: 'Подозрительная активность', user: '—', ip: '78.45.12.89', timestamp: '6 часов назад' },
];

export const serverLogs = [
  { id: 'l1', level: 'error', message: 'Redis connection timeout', timestamp: '2026-05-16 14:22:01' },
  { id: 'l2', level: 'warn', message: 'Search index rebuild triggered', timestamp: '2026-05-16 13:10:45' },
  { id: 'l3', level: 'info', message: 'User cache cleared', timestamp: '2026-05-16 12:00:00' },
  { id: 'l4', level: 'error', message: 'Queue worker crash on task #4592', timestamp: '2026-05-16 10:30:12' },
  { id: 'l5', level: 'info', message: 'System backup completed (1.4 GB)', timestamp: '2026-05-16 04:00:00' },
];

export const userActivityLog = [
  { action: 'Опубликовал объявление "Продам Toyota"', timestamp: '2 часа назад' },
  { action: 'Добавил комментарий к новости "Шторм..."', timestamp: '4 часа назад' },
  { action: 'Сохранил в избранное "ТЦ Остров"', timestamp: '6 часов назад' },
  { action: 'Отредактировал профиль', timestamp: '1 день назад' },
  { action: 'Сменил аватар', timestamp: '2 дня назад' },
];
