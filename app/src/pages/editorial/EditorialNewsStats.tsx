import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Clock, TrendingUp, Users, Globe, Activity } from 'lucide-react';
import { newsService } from '@/services';
import type { NewsArticle } from '@/services/news.service';

export default function EditorialNewsStats() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    newsService.getNewsById(id)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="sakh-meta text-center py-8">Загрузка...</p>;
  }

  if (!article) {
    return (
      <div className="sakh-empty">
        <h3 className="sakh-empty__title">Новость не найдена</h3>
        <Link to="/editorial/news" className="sakh-btn sakh-btn--primary sakh-btn--md mt-4">К списку</Link>
      </div>
    );
  }

  const stats = [
    { icon: Eye, label: 'Просмотры', value: article.viewsCount.toLocaleString('ru-RU'), color: 'text-[var(--accent-ocean)]' },
    { icon: Clock, label: 'Время чтения', value: `${article.readingTimeMinutes ?? '—'} мин`, color: 'text-[var(--accent-sunset)]' },
    { icon: TrendingUp, label: 'Комментарии', value: article.commentsCount.toString(), color: 'text-[var(--accent-ocean)]' },
    { icon: Users, label: 'Лайки', value: article.viewsCount.toString(), color: 'text-[var(--text-primary)]' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/editorial/news" className="sakh-meta sakh-meta--accent">
          <ArrowLeft size={14} className="inline mr-1" />
          К списку
        </Link>
        <span className="sakh-meta">Статистика: {article.title}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="sakh-card p-4"
          >
            <stat.icon size={20} className={stat.color + ' mb-2'} />
            <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">{stat.value}</p>
            <p className="sakh-meta">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sakh-card p-4"
        >
          <h3 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2 mb-4">
            <Activity size={14} />
            Просмотры по дням
          </h3>
          <div className="h-48 bg-[var(--bg-surface)] flex items-center justify-center">
            <p className="sakh-meta">График будет доступен после подключения API</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="sakh-card p-4"
        >
          <h3 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2 mb-4">
            <Globe size={14} />
            Источники трафика
          </h3>
          <div className="space-y-3">
            {[
              { source: 'Прямой заход', percent: 42 },
              { source: 'Поисковые системы', percent: 28 },
              { source: 'Социальные сети', percent: 18 },
              { source: 'Внешние ссылки', percent: 12 },
            ].map((item) => (
              <div key={item.source}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)]">{item.source}</span>
                  <span className="font-mono text-[var(--text-primary)]">{item.percent}%</span>
                </div>
                <div className="sakh-progress">
                  <div className="sakh-progress__bar" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
