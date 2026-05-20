import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { newsService } from '@/services';
import type { NewsArticle } from '@/services/news.service';

export default function EditorialNewsHistory() {
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

  const history = [
    { id: 'created', user: article.author?.name || '—', action: 'Создал материал', timestamp: new Date(article.createdAt).toLocaleString('ru-RU'), field: null as string | null },
  ];
  if (article.updatedAt && article.updatedAt !== article.createdAt) {
    history.push({ id: 'updated', user: article.author?.name || '—', action: 'Последнее изменение', timestamp: new Date(article.updatedAt).toLocaleString('ru-RU'), field: null });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/editorial/news" className="sakh-meta sakh-meta--accent">
          <ArrowLeft size={14} className="inline mr-1" />
          К списку
        </Link>
        <span className="sakh-meta">История изменений: {article.title}</span>
      </div>

      <div className="sakh-card p-4 max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[var(--accent-ocean)]" />
          <h2 className="sakh-caption text-[var(--text-secondary)]">История изменений</h2>
        </div>

        <div className="space-y-0">
          {history.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 py-3 border-b border-[var(--border-color)] last:border-0"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 mt-0.5">
                <User size={12} className="text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-medium">{entry.user}</span>
                  {' '}{entry.action}
                </p>
                <p className="sakh-meta">{entry.timestamp}</p>
              </div>
              {entry.field && (
                <span className="sakh-tag sakh-tag--muted">{entry.field}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
