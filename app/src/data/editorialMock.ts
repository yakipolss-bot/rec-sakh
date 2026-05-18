import type { NewsArticle, Comment } from '@/types';

export interface EditorialTask {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

export interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Redirect {
  id: string;
  from: string;
  to: string;
  created: string;
}

export interface BrokenLink {
  id: string;
  url: string;
  statusCode: number;
  foundAt: string;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  type: 'digest' | 'urgent' | 'thematic';
  sentAt: string;
  openRate: number;
  clickRate: number;
}

export interface EditorialEvent {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'moderation' | 'published';
  category: string;
}

export const editorialTasks: EditorialTask[] = [
  { id: 't1', title: 'Репортаж с открытия парка', assignee: 'Иван Петров', deadline: '17.05.2026', priority: 'high', status: 'in_progress' },
  { id: 't2', title: 'Интервью с губернатором', assignee: 'Анна Кузнецова', deadline: '18.05.2026', priority: 'medium', status: 'todo' },
  { id: 't3', title: 'Обзор экономики региона', assignee: 'Дмитрий Волков', deadline: '20.05.2026', priority: 'low', status: 'review' },
  { id: 't4', title: 'Фоторепортаж с парада', assignee: 'Мария Соколова', deadline: '16.05.2026', priority: 'high', status: 'in_progress' },
  { id: 't5', title: 'Статья о новых электробусах', assignee: 'Сергей Новиков', deadline: '19.05.2026', priority: 'medium', status: 'todo' },
];

export const activityFeed: ActivityEntry[] = [
  { id: 'a1', user: 'Анна Кузнецова', action: 'опубликовала', target: 'Штормовое предупреждение', timestamp: '10:30' },
  { id: 'a2', user: 'Иван Петров', action: 'отредактировал', target: 'Паромное сообщение Ванино-Холмск', timestamp: '10:15' },
  { id: 'a3', user: 'Мария Соколова', action: 'загрузила фото', target: 'Новый торговый центр', timestamp: '09:45' },
  { id: 'a4', user: 'Дмитрий Волков', action: 'отправил на проверку', target: 'Нефтегазовый проект на шельфе', timestamp: '09:20' },
  { id: 'a5', user: 'Елена Морозова', action: 'опубликовала', target: 'Редкие виды птиц на Сахалине', timestamp: '08:55' },
  { id: 'a6', user: 'Сергей Новиков', action: 'создал', target: 'Анонс матча «Сахалин» — «Амур»', timestamp: '08:30' },
];

export const editorialRedirects: Redirect[] = [
  { id: 'r1', from: '/old-news', to: '/news/new-news', created: '10.05.2026' },
  { id: 'r2', from: '/category/old-cat', to: '/category/new-cat', created: '09.05.2026' },
];

export const editorialBrokenLinks: BrokenLink[] = [
  { id: 'b1', url: 'https://old-partner.ru/article', statusCode: 404, foundAt: '15.05.2026' },
  { id: 'b2', url: 'https://gallery-archive.org/photo', statusCode: 500, foundAt: '14.05.2026' },
];

export const editorialNewsletters: NewsletterCampaign[] = [
  { id: 'nl1', subject: 'Дайджест недели: главное на Сахалине', type: 'digest', sentAt: '15.05.2026', openRate: 34.2, clickRate: 12.8 },
  { id: 'nl2', subject: 'Экстренное: штормовое предупреждение', type: 'urgent', sentAt: '14.05.2026', openRate: 78.5, clickRate: 45.1 },
  { id: 'nl3', subject: 'Спорт: победа «Сахалина»', type: 'thematic', sentAt: '13.05.2026', openRate: 28.9, clickRate: 8.3 },
  { id: 'nl4', subject: 'Культура: премьера в ТЮЗе', type: 'thematic', sentAt: '12.05.2026', openRate: 31.4, clickRate: 10.2 },
];

export const editorialEvents: EditorialEvent[] = [
  { id: 'ee1', title: 'Выставка «Карафуто»', date: '16.05.2026', status: 'published', category: 'exhibition' },
  { id: 'ee2', title: 'Концерт группы «ДДТ»', date: '18.05.2026', status: 'published', category: 'concert' },
  { id: 'ee3', title: 'Фестиваль еды на набережной', date: '22.06.2026', status: 'moderation', category: 'festival' },
  { id: 'ee4', title: 'Мастер-класс по фотографии', date: '25.06.2026', status: 'draft', category: 'exhibition' },
];

export const newsStatuses = [
  { value: 'draft', label: 'Черновик' },
  { value: 'scheduled', label: 'Запланирована' },
  { value: 'published', label: 'Опубликована' },
  { value: 'archived', label: 'Архив' },
];

export const cityOptions = [
  { value: '', label: 'Все города' },
  { value: 'yuzhno-sakhalinsk', label: 'Южно-Сахалинск' },
  { value: 'korsakov', label: 'Корсаков' },
  { value: 'kholmsk', label: 'Холмск' },
  { value: 'okha', label: 'Оха' },
  { value: 'nevelsk', label: 'Невельск' },
];
