import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Clock, Activity, Eye, MessageSquare, FileText,
  AlertTriangle, ArrowRight, DollarSign,
  TrendingUp, Users, Zap, Loader2,
} from 'lucide-react';
import { newsService } from '@/services/news.service';
import type { NewsArticle } from '@/services/news.service';

export default function EditorialDashboard() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await newsService.getNews({ perPage: 50, sortBy: 'publishedAt', sortOrder: 'desc' });
        if (mounted) setArticles(res.data || []);
      } catch {
        /* noop */
      }
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const urgentNews = articles.filter((n) => n.isUrgent);
  const todayViews = articles.reduce((sum, n) => sum + (n.viewsCount || 0), 0);
  const todayPublished = articles.filter(
    (n) => n.publishedAt && new Date(n.publishedAt).toDateString() === new Date().toDateString(),
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Дашборд</h1>
          <p className="sakh-meta mt-1">Панель управления редакцией</p>
        </div>
        <Link to="/editorial/news/create" className="sakh-btn sakh-btn--primary sakh-btn--md">
          <FileText size={14} />
          Новая новость
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Eye, label: 'Просмотры сегодня', value: todayViews.toLocaleString('ru-RU'), color: 'text-[var(--accent-ocean)]' },
          { icon: FileText, label: 'Публикации сегодня', value: `${todayPublished}`, color: 'text-[var(--accent-ocean)]' },
          { icon: TrendingUp, label: 'Всего материалов', value: `${articles.length}`, color: 'text-[var(--text-primary)]' },
          { icon: Zap, label: 'Срочных', value: `${urgentNews.length}`, color: 'text-[var(--accent-sunset)]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="sakh-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] font-mono">{stat.value}</p>
            <p className="sakh-meta mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sakh-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2">
              <Clock size={14} />
              Последние новости
            </h2>
            <Link to="/editorial/news" className="sakh-meta sakh-meta--accent flex items-center gap-1">
              Все <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {articles.slice(0, 5).map((a) => (
              <Link key={a.id} to={`/editorial/news/${a.id}/edit`} className="flex items-center gap-3 p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  a.status === 'draft' ? 'bg-[var(--accent-sunset)]' :
                  a.status === 'published' ? 'bg-[var(--accent-ocean)]' : 'bg-[var(--text-muted)]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{a.title}</p>
                  <p className="sakh-meta">{a.status === 'draft' ? 'Черновик' : a.status === 'published' ? 'Опубликовано' : a.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="sakh-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2">
              <Activity size={14} />
              Статистика статусов
            </h2>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Опубликовано', count: articles.filter(a => a.status === 'published').length, color: 'bg-[var(--accent-ocean)]' },
              { label: 'Черновики', count: articles.filter(a => a.status === 'draft').length, color: 'bg-[var(--accent-sunset)]' },
              { label: 'На проверке', count: articles.filter(a => a.status === 'review').length, color: 'bg-yellow-500' },
              { label: 'Архив', count: articles.filter(a => a.status === 'archived').length, color: 'bg-[var(--text-muted)]' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-2 bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-sm text-[var(--text-primary)]">{s.label}</span>
                </div>
                <span className="font-mono text-sm text-[var(--text-secondary)]">{s.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sakh-card p-4"
        >
          <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2 mb-4">
            <AlertTriangle size={14} />
            Экстренное
          </h2>
          {urgentNews.length > 0 ? (
            <div className="space-y-2">
              {urgentNews.map((news) => (
                <Link
                  key={news.id}
                  to={`/editorial/news/${news.id}/edit`}
                  className="flex items-center gap-3 p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <AlertTriangle size={14} className="text-[var(--accent-sunset)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{news.title}</p>
                    <p className="sakh-meta">{news.author?.name || ''} · {news.publishedAt?.slice(0, 10) || ''}</p>
                  </div>
                  <ArrowRight size={14} className="text-[var(--text-muted)] shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="sakh-body text-sm">Нет срочных материалов</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="sakh-card p-4"
        >
          <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2 mb-4">
            <Users size={14} />
            Модерация
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/editorial/comments"
              className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <MessageSquare size={24} className="text-[var(--accent-sunset)]" />
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">—</span>
              <span className="sakh-meta text-center">Комментариев на проверке</span>
            </Link>
            <Link
              to="/editorial/ads"
              className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <DollarSign size={24} className="text-[var(--accent-ocean)]" />
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">—</span>
              <span className="sakh-meta text-center">Объявлений на премодерации</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
