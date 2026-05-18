import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit3, Ban, LogIn, Mail, Phone, MapPin,
  Calendar, MessageSquare, FileText, Heart, Clock,
} from 'lucide-react';
import { adminUsers, userActivityLog } from '@/data/adminMock';
import EmptyState from '@/components/EmptyState';

const roleLabels: Record<string, string> = {
  user: 'Пользователь', moderator: 'Модератор', editor: 'Редактор', admin: 'Админ',
};
const statusLabels: Record<string, string> = {
  active: 'Активен', blocked: 'Заблокирован', pending: 'Ожидает',
};
const statusBadge: Record<string, string> = {
  active: 'sakh-tag--accent', blocked: 'sakh-tag--sunset', pending: 'sakh-tag--outline',
};
const roleBadge: Record<string, string> = {
  user: 'sakh-tag--outline', moderator: 'sakh-tag--accent', editor: 'sakh-tag--sunset', admin: 'sakh-tag--accent',
};

export default function AdminUserId() {
  const { id } = useParams();
  const user = adminUsers.find(u => u.id === id);

  if (!user) {
    return <EmptyState title="Пользователь не найден" description="Такого пользователя не существует." />;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--accent-ocean)] transition-colors"
      >
        <ArrowLeft size={14} />
        Назад к списку
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="sakh-card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-2xl font-mono font-bold text-[var(--accent-ocean)] mb-3">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">{user.name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <span className={`sakh-tag ${roleBadge[user.role]}`}>{roleLabels[user.role]}</span>
              <span className={`sakh-tag ${statusBadge[user.status]}`}>{statusLabels[user.status]}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <Mail size={12} className="text-[var(--text-muted)]" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <MapPin size={12} className="text-[var(--text-muted)]" />
              {user.city}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <Calendar size={12} className="text-[var(--text-muted)]" />
              Регистрация: {user.registeredAt}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <button className="sakh-btn sakh-btn--primary sakh-btn--sm w-full">
              <Edit3 size={14} />
              Редактировать
            </button>
            <button className="sakh-btn sakh-btn--ghost sakh-btn--sm w-full">
              <LogIn size={14} />
              Войти под пользователем
            </button>
            <button className="sakh-btn sakh-btn--danger sakh-btn--sm w-full">
              <Ban size={14} />
              Заблокировать
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Объявления', value: user.adsCount, icon: FileText },
              { label: 'Комментарии', value: user.commentsCount, icon: MessageSquare },
              { label: 'В избранном', value: 12, icon: Heart },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="sakh-card p-4 text-center">
                  <Icon size={16} className="mx-auto mb-1 text-[var(--text-muted)]" />
                  <p className="text-lg font-mono font-bold text-[var(--text-primary)]">{stat.value}</p>
                  <p className="sakh-meta">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="sakh-card p-4">
            <h3 className="sakh-caption text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Clock size={14} />
              Последняя активность
            </h3>
            <div className="space-y-2">
              {userActivityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-2 pb-2 border-b border-[var(--border-subtle)] last:border-0">
                  <p className="text-xs text-[var(--text-primary)] flex-1">{log.action}</p>
                  <span className="sakh-meta shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
