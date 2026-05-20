import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Clock, User } from 'lucide-react';
import { newsService } from '@/services';
import type { NewsArticle } from '@/services/news.service';

export default function EditorialNewsPreview() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    newsService.getNewsById(id)
      .then((article) => { if (!cancelled) setArticle(article); })
      .catch(() => { if (!cancelled) setArticle(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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

  const tagList = Array.isArray(article.tags)
    ? article.tags.map(t => (typeof t === 'string' ? t : t.tag.name))
    : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/editorial/news" className="sakh-meta sakh-meta--accent">
          <ArrowLeft size={14} className="inline mr-1" />
          К списку
        </Link>
        <span className="sakh-meta">Предпросмотр</span>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[720px] mx-auto"
      >
        {article.mainImageUrl && (
          <div className="mb-6">
            <img
              src={article.mainImageUrl}
              alt={article.title}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="sakh-tag sakh-tag--accent">{article.category?.name || article.categoryId || 'Без рубрики'}</span>
          <span className="sakh-meta flex items-center gap-1">
            <Clock size={12} />
            {article.readingTimeMinutes ?? '—'} мин чтения
          </span>
          <span className="sakh-meta flex items-center gap-1">
            <Eye size={12} />
            {article.viewsCount?.toLocaleString('ru-RU')}
          </span>
        </div>

        <h1 className="sakh-heading mb-4">{article.title}</h1>

        <div className="flex items-center gap-2 mb-6 text-sm text-[var(--text-secondary)]">
          <User size={14} />
          <span>{article.author?.name || '—'}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
        </div>

        <p className="text-lg text-[var(--text-primary)] font-medium leading-relaxed mb-6">
          {article.lead}
        </p>

        <div className="sakh-body whitespace-pre-line">
          {article.content}
        </div>

        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-[var(--border-color)]">
            {tagList.map((tag) => (
              <span key={tag} className="sakh-tag sakh-tag--outline">{tag}</span>
            ))}
          </div>
        )}
      </motion.article>
    </div>
  );
}
