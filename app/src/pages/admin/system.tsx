import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Database, Search, Image,
  ShieldAlert, RefreshCw, Trash2, Thermometer,
  CheckCircle, Zap, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { SystemHealthData } from '@/models/admin/SystemHealthData';
import type { AuditLogEntry } from '@/models/admin/AuditLogEntry';

const tabs = [
  { id: 'cache', label: 'Кэш', icon: Database },
  { id: 'search', label: 'Поиск', icon: Search },
  { id: 'media', label: 'Медиа', icon: Image },
  { id: 'security', label: 'Безопасность', icon: ShieldAlert },
  { id: 'updates', label: 'Обновления', icon: RefreshCw },
];

export default function AdminSystem() {
  const { section } = useParams();
  const sectionToTab: Record<string, string> = { cache: 'cache', search: 'search', media: 'media', security: 'security', updates: 'updates' };
  const [activeTab, setActiveTab] = useState((section && sectionToTab[section]) || 'cache');

  useEffect(() => {
    if (section && sectionToTab[section]) setActiveTab(sectionToTab[section]);
  }, [section]);
  const { data: health } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => adminService.getHealth().catch(() => null),
  });
  const { data: auditData } = useQuery({
    queryKey: ['admin', 'audit-log'],
    queryFn: () => adminService.getAuditLog({ perPage: 50 }).then(r => r.data).catch(() => [] as AuditLogEntry[]),
  });

  const audit = Array.isArray(auditData) ? (auditData as AuditLogEntry[]) : [];

  const securityLogs = audit.filter(
    (log) => log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('block') || log.action.toLowerCase().includes('security')
  );

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    try {
      await action();
      toast.success(successMsg);
    } catch {
      toast.error('Ошибка при выполнении операции');
    }
  };

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
                { label: 'Использование памяти', value: health ? `${health.memoryUsage.heapUsed} MB / ${health.memoryUsage.heapTotal} MB` : '—', icon: Database },
                { label: 'Статус кэша', value: health?.cacheStatus === 'healthy' ? 'Здоров' : (health?.cacheStatus || '—'), icon: Thermometer },
                { label: 'Статус API', value: health?.apiStatus === 'healthy' ? 'Здоров' : (health?.apiStatus || '—'), icon: CheckCircle },
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
              <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={() => handleAction(adminService.clearCache, 'Кэш очищен')}><Trash2 size={14} /> Очистить кэш</button>
              <button className="sakh-btn sakh-btn--secondary sakh-btn--md" onClick={() => handleAction(adminService.warmCache, 'Кэш прогрет')}><Zap size={14} /> Прогреть кэш</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'search' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Статус индекса</span>
                <span className={`sakh-tag ${health?.databaseStatus === 'connected' ? 'sakh-tag--accent' : 'sakh-tag--sunset'}`}>
                  {health?.databaseStatus === 'connected' ? 'Здоров' : 'Проблемы'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Статус API</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">{health?.apiStatus || '—'}</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={() => handleAction(adminService.reindexSearch, 'Поиск переиндексирован')}><RefreshCw size={14} /> Переиндексировать</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'media' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="sakh-caption">Платформа</span>
                  <span className="font-mono text-sm text-[var(--text-secondary)]">{health?.platform || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="sakh-caption">Node.js</span>
                  <span className="font-mono text-sm text-[var(--text-secondary)]">{health?.nodeVersion || '—'}</span>
                </div>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={() => handleAction(adminService.optimizeMedia, 'Медиа оптимизировано')}><Download size={14} /> Оптимизировать медиа</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="sakh-title mb-3">Аудит безопасности</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Событие</th>
                      <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Пользователь</th>
                      <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityLogs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8"><p className="sakh-meta">Нет записей безопасности</p></td>
                      </tr>
                    )}
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
                            <span className="font-mono text-xs text-[var(--text-secondary)]">{log.action}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{log.user}</td>
                        <td className="py-3 px-3 font-mono text-xs text-[var(--text-muted)]">{log.timestamp}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'updates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Текущая версия</span>
                <span className="font-mono text-sm text-[var(--accent-ocean)]">{health?.nodeVersion || '—'}</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={() => handleAction(adminService.checkUpdates, 'Проверка обновлений завершена')}><RefreshCw size={14} /> Проверить обновления</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
