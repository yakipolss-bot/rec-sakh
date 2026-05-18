import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database, ListOrdered, Search, Image,
  ShieldAlert, RefreshCw, Trash2, Thermometer,
  Zap, Ban, Clock, CheckCircle, XCircle, Download,
} from 'lucide-react';
import { systemHealth, securityLogs } from '@/data/adminMock';

const tabs = [
  { id: 'cache', label: 'Кэш', icon: Database },
  { id: 'queue', label: 'Очереди', icon: ListOrdered },
  { id: 'search', label: 'Поиск', icon: Search },
  { id: 'media', label: 'Медиа', icon: Image },
  { id: 'security', label: 'Безопасность', icon: ShieldAlert },
  { id: 'updates', label: 'Обновления', icon: RefreshCw },
];

const queueTasks = [
  { type: 'Рассылка новостей', status: 'processing', date: '5 мин назад' },
  { type: 'Генерация sitemap', status: 'pending', date: '15 мин назад' },
  { type: 'Оптимизация изображений', status: 'pending', date: '1 час назад' },
  { type: 'Экспорт статистики', status: 'failed', date: '2 часа назад' },
  { type: 'Очистка временных файлов', status: 'completed', date: '3 часа назад' },
  { type: 'Индексация поиска', status: 'pending', date: '3 часа назад' },
];

const statusIcon: Record<string, typeof CheckCircle> = {
  processing: Zap,
  pending: Clock,
  failed: XCircle,
  completed: CheckCircle,
};

const statusClass: Record<string, string> = {
  processing: 'text-[var(--accent-ocean)]',
  pending: 'text-[var(--text-muted)]',
  failed: 'text-[var(--accent-sunset)]',
  completed: 'text-[var(--accent-ocean)]',
};

export default function AdminSystem() {
  const [activeTab, setActiveTab] = useState('cache');

  return (
    <div className="space-y-6">
      <h1 className="sakh-heading">Система</h1>

      <div className="sakh-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`sakh-tabs__item flex items-center gap-2 ${activeTab === tab.id ? 'sakh-tabs__item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'cache' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Использование памяти', value: systemHealth.redis.memory, icon: Database },
                { label: 'Hit Rate', value: `${systemHealth.redis.hitRate}%`, icon: Thermometer },
                { label: 'Статус', value: systemHealth.redis.status === 'healthy' ? 'Здоров' : 'Проблемы', icon: CheckCircle },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="sakh-card p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-[var(--accent-ocean)]" />
                      <span className="sakh-caption">{m.label}</span>
                    </div>
                    <span className="font-mono text-lg text-[var(--text-primary)] block">{m.value}</span>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button className="sakh-btn sakh-btn--primary sakh-btn--md"><Trash2 size={14} /> Очистить кэш</button>
              <button className="sakh-btn sakh-btn--secondary sakh-btn--md"><Zap size={14} /> Прогреть кэш</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'queue' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-ocean)]" /> В обработке: {systemHealth.queue.processing}
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--text-muted)]" /> Ожидает: {systemHealth.queue.pending}
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent-sunset)]">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-sunset)]" /> Ошибки: {systemHealth.queue.failed}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Тип задачи</th>
                    <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                    <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {queueTasks.map((task, i) => {
                    const StatusIcon = statusIcon[task.status];
                    return (
                      <motion.tr
                        key={`${task.type}-${i}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-[var(--border-subtle)]"
                      >
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{task.type}</td>
                        <td className="py-3 px-3">
                          <span className="flex items-center gap-1.5">
                            <StatusIcon size={12} className={statusClass[task.status]} />
                            <span className={`font-mono text-xs ${statusClass[task.status]}`}>
                              {task.status === 'processing' ? 'В обработке' : task.status === 'pending' ? 'Ожидает' : task.status === 'failed' ? 'Ошибка' : 'Завершён'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-muted)]">{task.date}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'search' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Статус индекса</span>
                <span className={`sakh-tag ${systemHealth.search.status === 'healthy' ? 'sakh-tag--accent' : 'sakh-tag--sunset'}`}>
                  {systemHealth.search.status === 'healthy' ? 'Здоров' : 'Устарел'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Документов</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">{systemHealth.search.documents.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Последняя индексация</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">{systemHealth.search.lastIndexed}</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md"><RefreshCw size={14} /> Переиндексировать</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'media' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="sakh-caption">Использование хранилища</span>
                  <span className="font-mono text-sm text-[var(--text-secondary)]">{systemHealth.media.used} / {systemHealth.media.total}</span>
                </div>
                <div className="sakh-progress">
                  <div
                    className="sakh-progress__bar"
                    style={{ width: `${Math.round((parseInt(systemHealth.media.used) / parseInt(systemHealth.media.total)) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)]">{systemHealth.media.files.toLocaleString()} файлов</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md"><Download size={14} /> Оптимизировать медиа</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="sakh-title mb-3">Логи входов</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Событие</th>
                      <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Пользователь</th>
                      <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">IP</th>
                      <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityLogs.map((log, i) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-[var(--border-subtle)]"
                      >
                        <td className="py-3 px-3">
                          <span className="flex items-center gap-1.5">
                            {log.event.includes('Неудачная') || log.event.includes('Блокировка') || log.event.includes('Подозрительная') ? (
                              <Ban size={12} className="text-[var(--accent-sunset)]" />
                            ) : (
                              <CheckCircle size={12} className="text-[var(--accent-ocean)]" />
                            )}
                            <span className="font-mono text-xs text-[var(--text-secondary)]">{log.event}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{log.user}</td>
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-muted)]">{log.ip}</td>
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-muted)]">{log.timestamp}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3 className="sakh-title mb-3">Заблокированные IP</h3>
              <div className="flex flex-wrap gap-2">
                {['185.234.12.45', '91.123.45.67', '78.45.12.89'].map(ip => (
                  <span key={ip} className="sakh-tag sakh-tag--sunset">{ip}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'updates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Текущая версия</span>
                <span className="font-mono text-sm text-[var(--accent-ocean)]">v2.4.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Доступно обновление</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">v2.4.1</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <div>
                <span className="sakh-caption block mb-2">Что нового в v2.4.1:</span>
                <ul className="space-y-1">
                  {[
                    'Новый дизайн карточек объявлений',
                    'Улучшена производительность поиска',
                    'Исправлена ошибка отправки форм',
                    'Обновлены зависимости безопасности',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 font-mono text-xs text-[var(--text-secondary)]">
                      <span className="text-[var(--accent-ocean)] mt-0.5">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md"><RefreshCw size={14} /> Проверить обновления</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
