import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Activity,
  Eye, Clock, MousePointer, Loader2,
} from 'lucide-react';
import { adminService } from '@/services';
import { toast } from 'sonner';

type Tab = 'traffic' | 'content' | 'authors' | 'search' | 'online';

interface TopCategory { id: number; name: string; views: number }
interface ArticleSummary { id: number; title: string; viewsCount: number; author?: { id: string; name: string } }

const tabs: { value: Tab; label: string }[] = [
  { value: 'traffic', label: 'Трафик' },
  { value: 'content', label: 'Контент' },
  { value: 'authors', label: 'Авторы' },
  { value: 'search', label: 'Поиск' },
  { value: 'online', label: 'Онлайн' },
];

export default function EditorialAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('traffic');
  const [traffic, setTraffic] = useState<Record<string, unknown> | null>(null);
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [realtime, setRealtime] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const [trafficRes, contentRes, realtimeRes] = await Promise.allSettled([
          adminService.getAnalyticsTraffic(),
          adminService.getAnalyticsContent({ perPage: 10 }),
          adminService.getRealtimeAnalytics(),
        ]);

        if (trafficRes.status === 'fulfilled') setTraffic(trafficRes.value);
        if (contentRes.status === 'fulfilled') setContent(contentRes.value);
        if (realtimeRes.status === 'fulfilled') setRealtime(realtimeRes.value);
      } catch {
        if (!silent) toast.error('Ошибка загрузки аналитики');
      } finally {
        setIsLoading(false);
      }
    };
    load(false);
    const id = setInterval(() => load(true), 30000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[var(--accent-ocean)]" />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'traffic':
        return (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Eye, label: 'Всего просмотров', value: traffic?.totalViews?.toLocaleString('ru-RU') || '—' },
                { icon: Users, label: 'Статей за период', value: String(traffic?.totalArticles || 0) },
                { icon: MousePointer, label: 'Топ категорий', value: String(traffic?.topCategories?.length || 0) },
                { icon: Clock, label: 'Период (дней)', value: traffic?.period ? Math.ceil((new Date(traffic.period.to).getTime() - new Date(traffic.period.from).getTime()) / 86400000) + ' дн' : '30 дн' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="sakh-card p-4"
                >
                  <stat.icon size={18} className="text-[var(--accent-ocean)] mb-2" />
                  <p className="text-xl font-bold font-mono text-[var(--text-primary)]">{stat.value}</p>
                  <p className="sakh-meta">{stat.label}</p>
                </motion.div>
              ))}
            </div>
            {traffic?.topCategories?.length > 0 && (
              <div className="sakh-card p-4">
                <h3 className="sakh-caption text-[var(--text-secondary)] mb-3">Топ категорий по просмотрам</h3>
                {traffic.topCategories.map((cat: TopCategory, i: number) => (
                  <div key={cat.id || i} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)] last:border-0">
                    <span className="text-sm text-[var(--text-primary)]">{cat.name}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">{cat.views?.toLocaleString('ru-RU')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'content':
        return (
          <div className="sakh-card p-4">
            <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Топ материалов</h3>
            {content?.data?.length > 0 ? (
              content.data.slice(0, 10).map((article: ArticleSummary, i: number) => (
                <div key={article.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-color)] last:border-0">
                  <span className="sakh-meta sakh-meta--accent font-bold w-5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{article.title}</span>
                  <span className="sakh-meta">{article.viewsCount?.toLocaleString('ru-RU') || 0}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)] text-center py-4">Нет данных</p>
            )}
          </div>
        );
      case 'authors':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-3 py-2 text-left sakh-caption">Автор</th>
                  <th className="px-3 py-2 text-left sakh-caption">Материалов</th>
                  <th className="px-3 py-2 text-left sakh-caption">Всего просмотров</th>
                  <th className="px-3 py-2 text-left sakh-caption">Ср. просмотров</th>
                </tr>
              </thead>
              <tbody>
                {content?.data?.length > 0 ? (
                  Object.entries(
                    content.data.reduce((acc: Record<string, { name: string; count: number; views: number }>, a: ArticleSummary) => {
                      const key = a.author?.id || 'unknown';
                      if (!acc[key]) acc[key] = { name: a.author?.name || '—', count: 0, views: 0 };
                      acc[key].count++;
                      acc[key].views += a.viewsCount || 0;
                      return acc;
                    }, {} as Record<string, { name: string; count: number; views: number }>)
                  ).map(([_, author]: [string, { name: string; count: number; views: number }]) => (
                    <tr key={_}>
                      <td className="px-3 py-2 text-[var(--text-primary)]">{author.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{author.count}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{author.views.toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{Math.round(author.views / author.count).toLocaleString('ru-RU')}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center py-4 text-sm text-[var(--text-muted)]">Нет данных</td></tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'search':
        return (
          <div className="sakh-card p-4 text-center">
            <p className="text-sm text-[var(--text-muted)]">Поисковая аналитика — в разработке</p>
          </div>
        );
      case 'online':
        return (
          <div className="sakh-card p-6 text-center">
            <Activity size={48} className="mx-auto mb-4 text-[var(--accent-ocean)]" />
            <p className="text-4xl font-bold font-mono text-[var(--text-primary)] mb-2">
              {realtime?.onlineUsers || 0}
            </p>
            <p className="sakh-body">пользователей онлайн (за 15 мин)</p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 bg-[var(--bg-surface)]">
                <p className="text-lg font-mono font-bold text-[var(--accent-ocean)]">{realtime?.recentComments?.length || 0}</p>
                <p className="sakh-meta">Комментариев (5 мин)</p>
              </div>
              <div className="p-3 bg-[var(--bg-surface)]">
                <p className="text-lg font-mono font-bold text-[var(--accent-ocean)]">{realtime?.recentActivity?.length || 0}</p>
                <p className="sakh-meta">Действий (5 мин)</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <h1 className="sakh-heading mb-2">Аналитика</h1>
      <p className="sakh-meta mb-6">Статистика портала и активность пользователей</p>

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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
}
