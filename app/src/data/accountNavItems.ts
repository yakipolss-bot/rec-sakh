import {
  LayoutDashboard, User, MessageSquare, FileText, Briefcase,
  Calendar, Bell, Bookmark, CreditCard, Headphones,
  Lock, Eye, Heart
} from 'lucide-react';

export const accountNavItems = [
  { path: '/account', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { path: '/account/profile', label: 'Профиль', icon: User },
  { path: '/account/security', label: 'Безопасность', icon: Lock },
  { path: '/account/notifications', label: 'Уведомления', icon: Bell },
  { path: '/account/privacy', label: 'Приватность', icon: Eye },
  { path: '/account/comments', label: 'Комментарии', icon: MessageSquare },
  { path: '/account/ads', label: 'Объявления', icon: FileText },
  { path: '/account/jobs', label: 'Работа', icon: Briefcase },
  { path: '/account/events', label: 'События', icon: Calendar },
  { path: '/account/subscriptions', label: 'Подписки', icon: Heart },
  { path: '/account/favorites', label: 'Избранное', icon: Bookmark },
  { path: '/account/billing', label: 'Платежи', icon: CreditCard },
  { path: '/account/support', label: 'Поддержка', icon: Headphones },
];
