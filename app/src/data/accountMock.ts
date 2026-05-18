export interface AccountActivity {
  id: string;
  type: 'comment' | 'ad' | 'favorite' | 'login' | 'subscription';
  description: string;
  date: string;
  link?: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'closed' | 'waiting';
  createdAt: string;
  updatedAt: string;
}

export interface BillingOperation {
  id: string;
  type: 'payment' | 'withdrawal' | 'subscription';
  method: 'card' | 'sbp' | 'crypto' | 'system';
  amount: number;
  status: 'success' | 'pending' | 'failed';
  date: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface AuthorSubscription {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  subscribed: boolean;
}

export interface KeywordSubscription {
  id: string;
  keyword: string;
}

export const accountActivity: AccountActivity[] = [
  { id: 'a1', type: 'comment', description: 'Оставили комментарий к новости «Штормовое предупреждение»', date: '2026-05-16T10:30:00+11:00', link: '/news/shtormovoe-preduprezhdenie-po-sakhalinskoy-oblasti' },
  { id: 'a2', type: 'favorite', description: 'Добавили «Новый торговый центр» в избранное', date: '2026-05-16T08:15:00+11:00', link: '/news/novyy-torgovyy-tsentr-v-yuzhno-sakhalinske' },
  { id: 'a3', type: 'ad', description: 'Подали объявление «Продам Toyota Camry 2020»', date: '2026-05-15T14:00:00+11:00', link: '/ads/toyota-camry-2020' },
  { id: 'a4', type: 'login', description: 'Вход в аккаунт с нового устройства (Chrome, Windows)', date: '2026-05-15T09:00:00+11:00' },
  { id: 'a5', type: 'subscription', description: 'Подписались на рубрику «Транспорт»', date: '2026-05-14T11:20:00+11:00' },
];

export const supportTickets: SupportTicket[] = [
  { id: 't1', subject: 'Не приходит письмо подтверждения', category: 'Техническая проблема', status: 'open', createdAt: '2026-05-14T09:15:00+11:00', updatedAt: '2026-05-14T09:15:00+11:00' },
  { id: 't2', subject: 'Ошибка при оплате объявления', category: 'Оплата', status: 'waiting', createdAt: '2026-05-12T16:30:00+11:00', updatedAt: '2026-05-13T10:00:00+11:00' },
  { id: 't3', subject: 'Предложение по улучшению сайта', category: 'Предложение', status: 'closed', createdAt: '2026-05-01T11:00:00+11:00', updatedAt: '2026-05-05T14:30:00+11:00' },
  { id: 't4', subject: 'Модерация комментария затянулась', category: 'Модерация', status: 'open', createdAt: '2026-05-15T20:45:00+11:00', updatedAt: '2026-05-15T20:45:00+11:00' },
];

export const billingOperations: BillingOperation[] = [
  { id: 'b1', type: 'payment', method: 'card', amount: 500, status: 'success', date: '2026-05-14T14:30:00+11:00', description: 'Пополнение баланса' },
  { id: 'b2', type: 'subscription', method: 'system', amount: -299, status: 'success', date: '2026-05-01T00:00:00+11:00', description: 'Тариф «Премиум» — май 2026' },
  { id: 'b3', type: 'payment', method: 'sbp', amount: 1000, status: 'success', date: '2026-04-25T10:15:00+11:00', description: 'Пополнение через СБП' },
  { id: 'b4', type: 'withdrawal', method: 'system', amount: -150, status: 'success', date: '2026-04-20T09:00:00+11:00', description: 'Продвижение объявления «Выделить»' },
  { id: 'b5', type: 'payment', method: 'crypto', amount: 200, status: 'pending', date: '2026-04-18T22:00:00+11:00', description: 'Пополнение через USDT' },
  { id: 'b6', type: 'subscription', method: 'system', amount: -299, status: 'success', date: '2026-04-01T00:00:00+11:00', description: 'Тариф «Премиум» — апрель 2026' },
];

export const faqItems: FaqItem[] = [
  { id: 'f1', question: 'Как восстановить пароль?', answer: 'На странице входа нажмите «Забыли пароль» и следуйте инструкциям. Ссылка для сброса придёт на вашу почту.' },
  { id: 'f2', question: 'Как подать объявление?', answer: 'Перейдите в раздел «Мои объявления» и нажмите «Подать объявление». Заполните форму и отправьте на модерацию.' },
  { id: 'f3', question: 'Как подключить Telegram-бота?', answer: 'В настройках уведомлений найдите раздел Telegram-бот и нажмите «Подключить». Перейдите по ссылке в бота и отправьте код.' },
  { id: 'f4', question: 'Сколько стоит премиум-тариф?', answer: 'Премиум-тариф стоит 299 ₽/мес. Он отключает рекламу, даёт приоритетную модерацию и доступ к расширенной статистике.' },
  { id: 'f5', question: 'Как удалить аккаунт?', answer: 'Напишите в поддержку запрос на удаление аккаунта. Мы обработаем его в течение 3 рабочих дней.' },
];

export const blockedUsers: { id: string; name: string }[] = [];

export const authorSubscriptions: AuthorSubscription[] = [
  { id: 'as1', authorId: 'a1', authorName: 'Анна Кузнецова', authorRole: 'Корреспондент', subscribed: true },
  { id: 'as2', authorId: 'a4', authorName: 'Дмитрий Волков', authorRole: 'Фотокорреспондент', subscribed: true },
  { id: 'as3', authorId: 'a5', authorName: 'Елена Морозова', authorRole: 'Обозреватель', subscribed: false },
];

export const keywordSubscriptions: KeywordSubscription[] = [
  { id: 'k1', keyword: 'Сахалин' },
  { id: 'k2', keyword: 'рыболовство' },
  { id: 'k3', keyword: 'паром' },
  { id: 'k4', keyword: 'электробусы' },
];
