import { Link } from 'react-router-dom';
import { Bookmark, Eye, MessageSquare, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useFavorites } from '@/hooks/useFavorites';
import type { NewsArticle } from '@/types';

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'default' | 'hero' | 'compact';
  index?: number;
}

export default function NewsCard({ article, variant = 'default', index = 0 }: NewsCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(article.id);

  const formattedDate = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
    locale: ru,
  });

  if (variant === 'hero') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="sakh-card group cursor-pointer h-full flex flex-col"
      >
        <Link to={`/news/${article.slug}`} className="flex flex-col h-full">
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={article.mainImageUrl || ''}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {article.isUrgent && (
              <div
                className="sakh-tag sakh-tag--sunset absolute top-3 left-3"
                style={{ zIndex: 1 }}
              >
                Срочно
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="sakh-meta sakh-meta--accent">
                {article.category.name}
              </span>
              <span className="sakh-meta">
                <Clock size={10} />
                {formattedDate}
              </span>
            </div>
            <h3 className="sakh-title line-clamp-3 mb-3 flex-1">
              {article.title}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="sakh-meta sakh-meta--with-icon">
                  <Eye size={12} />
                  {article.views.toLocaleString('ru-RU')}
                </span>
                <span className="sakh-meta sakh-meta--with-icon">
                  <MessageSquare size={12} />
                  {article.commentsCount}
                </span>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(article.id); }}
                className="p-1 transition-colors"
                style={{ color: fav ? 'var(--accent-ocean)' : 'var(--text-muted)' }}
                aria-label={fav ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Bookmark size={16} fill={fav ? 'var(--accent-ocean)' : 'none'} />
              </button>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="sakh-card group cursor-pointer"
      >
        <Link to={`/news/${article.slug}`} className="flex gap-4 p-3">
          <div className="w-24 h-16 shrink-0 overflow-hidden">
            <img
              src={article.mainImageUrl || ''}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium leading-snug line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>
              {article.title}
            </h4>
            <div className="flex items-center gap-2">
              <span className="sakh-meta">{formattedDate}</span>
              <span className="sakh-meta sakh-meta--with-icon">
                <Eye size={10} />
                {article.views.toLocaleString('ru-RU')}
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`sakh-card group cursor-pointer flex flex-col h-full ${article.isUrgent ? 'sakh-card--urgent' : ''}`}
    >
      <Link to={`/news/${article.slug}`} className="flex flex-col h-full">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={article.mainImageUrl || ''}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {article.isUrgent && (
            <div className="sakh-tag sakh-tag--sunset absolute top-3 left-3" style={{ zIndex: 1 }}>
              Срочно
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="sakh-meta sakh-meta--accent">
              {article.category.name}
            </span>
            <span className="sakh-meta sakh-meta--with-icon">
              <Clock size={10} />
              {formattedDate}
            </span>
          </div>
          <h3 className="sakh-title line-clamp-2 mb-3 flex-1">
            {article.title}
          </h3>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              <span className="sakh-meta sakh-meta--with-icon">
                <Eye size={12} />
                {article.views.toLocaleString('ru-RU')}
              </span>
              <span className="sakh-meta sakh-meta--with-icon">
                <MessageSquare size={12} />
                {article.commentsCount}
              </span>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(article.id); }}
              className="p-1 transition-colors"
              style={{ color: fav ? 'var(--accent-ocean)' : 'var(--text-muted)' }}
              aria-label={fav ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              <Bookmark size={16} fill={fav ? 'var(--accent-ocean)' : 'none'} />
            </button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
