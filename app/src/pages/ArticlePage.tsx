import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, MessageSquare, Clock, Bookmark, Share2,
  Calendar, Copy, Check, Send, Play, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import CommentSection from '@/components/CommentSection';
import NewsCard from '@/components/NewsCard';
import { getNewsBySlug, getNewsById, getCommentsByNewsId, getRelatedNews } from '@/data/mock';
import { useFavorites } from '@/hooks/useFavorites';
function renderContentBlock(block: string, i: number, variants: Record<string, unknown>) {
  const trimmed = block.trim();

  if (/^{video}/.test(trimmed)) {
    return (
      <motion.div key={i} variants={variants} className="sakh-video-placeholder">
        <Play size={48} className="text-[var(--text-muted)]" />
        <span className="sakh-caption absolute bottom-3 left-3">Видео</span>
      </motion.div>
    );
  }

  if (/^{quote}/.test(trimmed)) {
    const text = trimmed.replace(/^{quote}/, '').trim();
    return (
      <motion.blockquote key={i} variants={variants} className="sakh-quote">
        {text}
      </motion.blockquote>
    );
  }

  if (/^{infographic}/.test(trimmed)) {
    return (
      <motion.div key={i} variants={variants} className="sakh-infographic-placeholder">
        <span className="sakh-caption">Инфографика</span>
      </motion.div>
    );
  }

  return (
    <motion.p key={i} variants={variants}>
      {trimmed || block}
    </motion.p>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const shareVariants = {
  hidden: { scale: 1 },
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400 } },
};

export default function ArticlePage({ id }: { id?: string }) {
  const params = useParams<{ id: string }>();
  const articleId = id || params.id;
  const article = articleId ? getNewsBySlug(articleId) || getNewsById(articleId) : undefined;
  const { isFavorite, toggleFavorite } = useFavorites();

  const [toast, setToast] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rec-sakh.ru';

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast('Ссылка скопирована');
    } catch {
      setToast('Не удалось скопировать');
    }
    setTimeout(() => setToast(null), 3000);
  }, []);

  if (!article) {
    return (
      <div className="pt-24 pb-8 max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <h1 className="sakh-heading text-[var(--text-primary)]">Новость не найдена</h1>
        <Link
          to="/"
          className="sakh-link inline-flex items-center gap-2 mt-4 text-sm"
        >
          <ArrowLeft size={16} />
          На главную
        </Link>
      </div>
    );
  }

  const articleComments = getCommentsByNewsId(article.id);
  const relatedNews = getRelatedNews(article);
  const fav = isFavorite(article.id);

  const formattedDate = format(new Date(article.publishedAt), 'd MMMM yyyy, HH:mm', { locale: ru });
  const formattedUpdate = format(new Date(article.updatedAt), 'd MMMM yyyy, HH:mm', { locale: ru });
  const showUpdated = article.updatedAt !== article.publishedAt;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${baseUrl}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category.name,
        item: `${baseUrl}/category/${article.category.slug}`,
      },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${baseUrl}/news/${article.slug}` },
    ],
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.lead,
    image: article.mainImageUrl?.startsWith('http') ? article.mainImageUrl : `${baseUrl}${article.mainImageUrl || ''}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sakhcom',
      logo: `${baseUrl}/logo.png`,
    },
    articleSection: article.category.name,
    about: {
      '@type': 'Place',
      name: article.city,
    },
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `${baseUrl}/news/${article.slug}`;
  const shareTitle = encodeURIComponent(article.title);

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--accent-ocean)]"
        >
          <ArrowLeft size={16} />
          На главную
        </Link>

        {/* JSON-LD Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <motion.div
            className="lg:col-span-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] flex-wrap">
                <li>
                  <Link to="/" className="transition-colors hover:text-[var(--accent-ocean)]">
                    Главная
                  </Link>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={12} />
                </li>
                <li>
                  <Link
                    to={`/category/${article.category.slug}`}
                    className="transition-colors hover:text-[var(--accent-ocean)]"
                  >
                    {article.category.name}
                  </Link>
                </li>
                <li className="flex items-center">
                  <ChevronRight size={12} />
                </li>
                <li className="text-[var(--text-secondary)] truncate max-w-[200px] sm:max-w-[400px]">
                  {article.title}
                </li>
              </ol>
            </nav>

            {/* Article */}
            <article aria-label="Статья">
              {/* Header */}
              <header className="mb-8">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Link
                    to={`/category/${article.category.slug}`}
                    className="sakh-tag sakh-tag--accent hover:bg-[var(--accent-ocean)] hover:text-[var(--bg-primary)] transition-colors"
                  >
                    {article.category.name}
                  </Link>
                  {article.isUrgent && (
                    <span className="sakh-tag sakh-tag--sunset">Срочно</span>
                  )}
                </div>

                <h1 className="sakh-display mb-4 text-[clamp(1.75rem,4vw,3rem)]">
                  {article.title}
                </h1>

                <p className="text-lg leading-relaxed mb-6 text-[var(--text-secondary)]">
                  {article.lead}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-b border-[var(--border-color)]">
                  <address className="flex items-center gap-3 not-italic">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono uppercase bg-[var(--bg-surface)] text-[var(--accent-ocean)] shrink-0">
                      {article.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {article.author.name}
                      </div>
                      <div className="text-xs font-mono text-[var(--text-muted)]">
                        {article.author.role}
                      </div>
                    </div>
                  </address>

                  <div className="flex items-center gap-4">
                    <span className="sakh-meta sakh-meta--with-icon">
                      <Eye size={12} />
                      {article.views.toLocaleString('ru-RU')}
                    </span>
                    <span className="sakh-meta sakh-meta--with-icon">
                      <MessageSquare size={12} />
                      {article.commentsCount}
                    </span>
                    <span className="sakh-meta sakh-meta--with-icon">
                      <Clock size={12} />
                      {article.readingTimeMinutes} мин
                    </span>
                    <time dateTime={article.publishedAt} className="sakh-meta sakh-meta--with-icon">
                      <Calendar size={12} />
                      {formattedDate}
                    </time>
                    <motion.button
                      onClick={() => toggleFavorite(article.id)}
                      whileTap={{ scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="p-2 transition-colors text-[var(--text-muted)] hover:text-[var(--accent-ocean)]"
                      aria-label={fav ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      <Bookmark size={18} fill={fav ? 'var(--accent-ocean)' : 'none'} />
                    </motion.button>
                    <button
                      className="p-2 transition-colors text-[var(--text-muted)] hover:text-[var(--accent-ocean)]"
                      aria-label="Поделиться"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </header>

              {/* Main Image */}
              {article.mainImageUrl && (
                <figure className="mb-8">
                  <img
                    src={article.mainImageUrl}
                    alt={article.title}
                    className="w-full aspect-video object-cover"
                    loading="eager"
                  />
                  <figcaption className="sakh-caption mt-2 text-center">
                    Иллюстрация: {article.title}
                  </figcaption>
                </figure>
              )}

              {/* Content */}
              <div className="sakh-prose mb-8">
                {article.content.split('\n\n').map((block, i) =>
                  renderContentBlock(block, i, contentVariants),
                )}
              </div>

              {/* Share Buttons */}
              <aside aria-label="Поделиться" className="flex items-center gap-3 mb-8 flex-wrap">
                <span className="sakh-caption">Поделиться:</span>
                <motion.a
                  variants={shareVariants}
                  initial="hidden"
                  whileHover="hover"
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sakh-btn sakh-btn--sm sakh-btn--secondary"
                  aria-label="Поделиться в Telegram"
                >
                  <Send size={14} />
                  Telegram
                </motion.a>
                <motion.a
                  variants={shareVariants}
                  initial="hidden"
                  whileHover="hover"
                  href={`https://vk.com/share.php?url=${encodeURIComponent(shareUrl)}&title=${shareTitle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sakh-btn sakh-btn--sm sakh-btn--secondary"
                  aria-label="Поделиться во ВКонтакте"
                >
                  <Share2 size={14} />
                  VK
                </motion.a>
                <motion.a
                  variants={shareVariants}
                  initial="hidden"
                  whileHover="hover"
                  href={`https://wa.me/?text=${shareTitle}%20${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sakh-btn sakh-btn--sm sakh-btn--secondary"
                  aria-label="Поделиться в WhatsApp"
                >
                  <Send size={14} />
                  WhatsApp
                </motion.a>
                <motion.button
                  variants={shareVariants}
                  initial="hidden"
                  whileHover="hover"
                  onClick={copyLink}
                  className="sakh-btn sakh-btn--sm sakh-btn--secondary"
                  aria-label="Скопировать ссылку"
                >
                  <Copy size={14} />
                  Копировать
                </motion.button>
              </aside>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="sakh-tag sakh-tag--outline hover:border-[var(--accent-ocean)] hover:text-[var(--accent-ocean)] transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Updated */}
              {showUpdated && (
                <p className="sakh-caption mb-8">
                  Обновлено: <time dateTime={article.updatedAt}>{formattedUpdate}</time>
                </p>
              )}
            </article>

            <CommentSection newsId={article.id} comments={articleComments} />
          </motion.div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6" aria-label="Читайте также">
            {relatedNews.length > 0 && (
              <div className="sakh-card">
                <div className="p-4 border-b border-[var(--border-color)]">
                  <h3 className="sakh-caption text-[var(--text-primary)]">
                    Читайте также
                  </h3>
                </div>
                <div className="divide-y divide-[var(--border-color)]">
                  {relatedNews.map((item, i) => (
                    <NewsCard key={item.id} article={item} variant="compact" index={i} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="sakh-toast sakh-toast--success fixed bottom-4 left-1/2"
            role="status"
            aria-live="polite"
          >
            <Check size={20} className="text-[var(--accent-ocean)] shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
