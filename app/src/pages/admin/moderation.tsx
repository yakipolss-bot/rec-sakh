import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, AlertTriangle,
  Activity, Ban, Flag, BookOpen, Sliders,
} from 'lucide-react';
import { moderationQueue, moderationRules } from '@/data/adminMock';

const tabs = ['Жалобы на контент', 'На пользователей', 'Авто-модерация', 'Правила'];

const reportStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

const reportStatusStyle: Record<string, string> = {
  pending: 'sakh-tag--sunset',
  approved: 'sakh-tag--accent',
  rejected: 'sakh-tag--outline',
};

const actionLabels: Record<string, string> = {
  block: 'Блокировка',
  flag: 'Пометка',
  approve: 'Одобрение',
};

const actionStyle: Record<string, string> = {
  block: 'sakh-tag--sunset',
  flag: 'sakh-tag--accent',
  approve: 'sakh-tag--outline',
};

const ruleStatusLabels: Record<string, string> = {
  active: 'Активно',
  inactive: 'Отключено',
};

const ruleStatusStyle: Record<string, string> = {
  active: 'sakh-tag--accent',
  inactive: 'sakh-tag--outline',
};

export default function AdminModeration() {
  const [tab, setTab] = useState(0);

  const contentReports = moderationQueue.filter(r => r.contentType !== 'Пользователь');
  const userReports = moderationQueue.filter(r => r.contentType === 'Пользователь');
  const pendingCount = moderationQueue.filter(r => r.status === 'pending').length;

  const autoStats = [
    { label: 'Всего проверено', value: '12 847', icon: Activity },
    { label: 'Заблокировано', value: '1 234', icon: Ban },
    { label: 'Отмечено флагом', value: '3 456', icon: Flag },
    { label: 'Ожидают проверки', value: String(pendingCount), icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Модерация</h1>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[var(--accent-ocean)]" />
          {pendingCount > 0 && (
            <span className="sakh-meta text-[var(--accent-sunset)]">
              {pendingCount} на проверке
            </span>
          )}
        </div>
      </div>

      <div className="sakh-tabs">
        {tabs.map((t, i) => (
          <button
            key={t}
            className={`sakh-tabs__item ${tab === i ? 'sakh-tabs__item--active' : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Тип</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Причина</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Автор</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дата</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {contentReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)] font-mono text-xs">
                    Нет жалоб на контент
                  </td>
                </tr>
              ) : contentReports.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{r.contentType}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{r.reason}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--accent-ocean)]">{r.author}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{r.createdAt}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${reportStatusStyle[r.status]}`}>
                      {reportStatusLabels[r.status]}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <button
                          className="sakh-btn sakh-btn--secondary sakh-btn--sm"
                          title="Одобрить"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="sakh-btn sakh-btn--danger sakh-btn--sm"
                          title="Отклонить"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {tab === 1 && (
        <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Тип</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Причина</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Автор</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дата</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {userReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)] font-mono text-xs">
                    Нет жалоб на пользователей
                  </td>
                </tr>
              ) : userReports.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{r.contentType}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{r.reason}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--accent-ocean)]">{r.author}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{r.createdAt}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${reportStatusStyle[r.status]}`}>
                      {reportStatusLabels[r.status]}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <button
                          className="sakh-btn sakh-btn--secondary sakh-btn--sm"
                          title="Одобрить"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          className="sakh-btn sakh-btn--danger sakh-btn--sm"
                          title="Отклонить"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {tab === 2 && (
        <motion.div key="auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {autoStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="sakh-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="sakh-meta">{stat.label}</span>
                    <Icon size={18} className="text-[var(--accent-ocean)]" />
                  </div>
                  <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="sakh-card p-4">
            <h3 className="sakh-caption text-[var(--text-primary)] mb-4">Настройки авто-модерации</h3>
            <div className="space-y-4">
              {[
                { label: 'Мат-фильтр', desc: 'Автоматическая блокировка нецензурной лексики', enabled: true },
                { label: 'Спам-фильтр', desc: 'Блокировка сообщений с подозрительными ссылками', enabled: true },
                { label: 'Капс-фильтр', desc: 'Пометка сообщений с чрезмерным использованием заглавных', enabled: true },
                { label: 'Повторы', desc: 'Блокировка повторяющихся сообщений', enabled: false },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <div>
                    <p className="text-sm font-mono text-[var(--text-primary)]">{s.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.desc}</p>
                  </div>
                  <button
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      s.enabled ? 'bg-[var(--accent-ocean)]' : 'bg-[var(--bg-surface)]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      s.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sakh-card p-4">
            <h3 className="sakh-caption text-[var(--text-primary)] mb-3">Последние действия</h3>
            <div className="space-y-2">
              {[
                { action: 'Заблокирован комментарий', detail: 'мат в сообщении', time: '2 мин назад' },
                { action: 'Помечен пользователь', detail: 'подозрение на спам', time: '15 мин назад' },
                { action: 'Одобрен комментарий', detail: 'авто-одобрение', time: '1 час назад' },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-ocean)]" />
                    <span className="text-xs font-mono text-[var(--text-primary)]">{a.action}</span>
                    <span className="text-xs text-[var(--text-muted)]">{a.detail}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 3 && (
        <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Правило</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Паттерн</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Действие</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Приоритет</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {moderationRules.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{r.rule}</td>
                  <td className="py-3 px-3">
                    <code className="text-xs bg-[var(--bg-surface)] px-2 py-0.5 text-[var(--accent-ocean)] font-mono">
                      {r.pattern}
                    </code>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${actionStyle[r.action]}`}>{actionLabels[r.action]}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs text-[var(--text-primary)]">{r.priority}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${ruleStatusStyle[r.status]}`}>{ruleStatusLabels[r.status]}</span>
                  </td>
                  <td className="py-3 px-3">
                    <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Редактировать">
                      <Sliders size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
