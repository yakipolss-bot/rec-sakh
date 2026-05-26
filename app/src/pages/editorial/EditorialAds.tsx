import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, XCircle, Eye, BarChart3, Loader2 } from 'lucide-react';
import apiClient from '../../services/api-client';
import { toast } from 'sonner';

type Tab = 'moderation' | 'categories' | 'stats';

const tabs: { value: Tab; label: string }[] = [
  { value: 'moderation', label: 'На модерации' },
  { value: 'categories', label: 'Все категории' },
  { value: 'stats', label: 'Статистика' },
];

interface AdItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  author?: { id: string; name: string };
  category?: { id: string; name: string };
}

interface AdStats {
  total: number;
  active: number;
  pending: number;
  rejected: number;
  byCategory?: { name: string; count: number }[];
}

export default function EditorialAds() {
  const queryClient = useQueryClient();
  const { section } = useParams();
  const sectionToTab: Record<string, Tab> = { moderation: 'moderation', categories: 'categories', stats: 'stats' };
  const [activeTab, setActiveTab] = useState<Tab>((section && sectionToTab[section]) || 'moderation');

  useEffect(() => {
    if (section && sectionToTab[section]) setActiveTab(sectionToTab[section]);
  }, [section]);

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['editorial', 'ads-pending'],
    queryFn: () => apiClient.get('/ads', { params: { status: 'pending', perPage: 50 } }).then(r => {
      const d = r.data;
      return (d?.data || d || []) as AdItem[];
    }),
    refetchInterval: 30000,
  });
  const pendingAds = Array.isArray(pendingData) ? pendingData : [];

  const { data: statsData } = useQuery({
    queryKey: ['editorial', 'ads-stats'],
    queryFn: () => apiClient.get('/ads/stats').then(r => {
      const d = r.data;
      return (d?.data || d) as AdStats;
    }),
    refetchInterval: 30000,
  });
  const stats = statsData || null;
  const categories = stats?.byCategory || [];

  const isLoading = pendingLoading;

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await apiClient.patch(`/ads/${id}/status`, { status });
      toast.success(`Объявление ${status === 'approved' ? 'одобрено' : 'отклонено'}`);
      queryClient.invalidateQueries({ queryKey: ['editorial', 'ads-pending'] });
    } catch {
      toast.error('Ошибка при модерации');
    }
  };

  return (
    <div>
      <h1 className="sakh-heading mb-2">Объявления</h1>
      <p className="sakh-meta mb-6">Управление пользовательскими объявлениями</p>

      <div className="sakh-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`sakh-tabs__item ${activeTab === tab.value ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[var(--accent-ocean)]" />
        </div>
      ) : (
        <>
          {activeTab === 'moderation' && (
            pendingAds.length === 0 ? (
              <div className="sakh-card p-8 text-center">
                <CheckCircle size={40} className="mx-auto mb-4 text-[var(--accent-ocean)]" />
                <h3 className="sakh-title mb-2">Нет объявлений на модерации</h3>
                <p className="sakh-body text-sm text-[var(--text-secondary)]">Все объявления проверены</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="px-3 py-2 text-left sakh-caption">Объявление</th>
                      <th className="px-3 py-2 text-left sakh-caption">Автор</th>
                      <th className="px-3 py-2 text-left sakh-caption">Категория</th>
                      <th className="px-3 py-2 text-left sakh-caption">Дата</th>
                      <th className="px-3 py-2 sakh-caption">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAds.map((ad, i) => (
                      <motion.tr
                        key={ad.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
                      >
                        <td className="px-3 py-3 text-[var(--text-primary)]">{ad.title}</td>
                        <td className="px-3 py-3 sakh-meta">{ad.author?.name || '—'}</td>
                        <td className="px-3 py-3">
                          <span className="sakh-tag sakh-tag--outline">{ad.category?.name || '—'}</span>
                        </td>
                        <td className="px-3 py-3 sakh-meta">{new Date(ad.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleModerate(ad.id, 'approved')} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-ocean)]" title="Одобрить">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => handleModerate(ad.id, 'rejected')} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]" title="Отклонить">
                              <XCircle size={14} />
                            </button>
                            <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5" title="Просмотр">
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'categories' && (
            categories.length === 0 ? (
              <div className="sakh-card p-8 text-center">
                <p className="sakh-body text-sm text-[var(--text-secondary)]">Нет данных о категориях</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <div key={cat.name} className="sakh-card p-4 flex items-center justify-between">
                    <span className="text-sm text-[var(--text-primary)]">{cat.name}</span>
                    <span className="font-mono text-xs text-[var(--accent-ocean)]">{cat.count}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="sakh-card p-4"
              >
                <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Общая статистика</h3>
                <div className="space-y-3">
                  {[
                    { icon: DollarSign, label: 'Всего объявлений', value: String(stats.total || 0) },
                    { icon: BarChart3, label: 'Активных', value: String(stats.active || 0) },
                    { icon: CheckCircle, label: 'Одобренных', value: String(stats.active || 0) },
                    { icon: XCircle, label: 'Отклонённых', value: String(stats.rejected || 0) },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                      <div className="flex items-center gap-2">
                        <stat.icon size={14} className="text-[var(--text-muted)]" />
                        <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
                      </div>
                      <span className="font-mono text-sm text-[var(--text-primary)]">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="sakh-card p-4"
              >
                <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Популярные категории</h3>
                {categories.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">Нет данных</p>
                ) : (
                  <div className="space-y-2">
                    {categories.slice(0, 5).map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-[var(--text-secondary)]">{cat.name}</span>
                          <span className="font-mono text-xs text-[var(--text-primary)]">{cat.count}</span>
                        </div>
                        <div className="sakh-progress">
                          <div className="sakh-progress__bar" style={{
                            width: `${(cat.count / Math.max(...categories.map((c) => c.count))) * 100}%`,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
