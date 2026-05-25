import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, MessageSquare, Clock, Bookmark,
  Calendar, Check, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import CommentSection from '@/components/CommentSection';
import NewsCard from '@/components/NewsCard';
import ShareButtons from '@/components/ShareButtons';
import AdSlot from '@/components/AdSlot';
import SEOHead from '@/components/SEOHead';
import newsService from '@/services/news.service';
import commentsService from '@/services/comments.service';
import { useFavorites } from '@/hooks/useFavorites';
import { renderTipTapJson, estimateReadingTime, injectAdAfterParagraph } from '@/lib/tiptap-renderer';
import type { NewsArticle } from '@/types';
import type { Comment } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export default function ArticlePage({ id }: { id?: string }) {
  const params = useParams<{ id: string }>();
  const articleId = id || params.id;

  const { data, isLoading } = useQuery({
    queryKey: ['article-full', articleId],
    queryFn: async () => {
      const result = await newsService.getNewsById(articleId!);
      const [comments, related] = await Promise.all([
        commentsService.getComments(result.id).catch(() => []),
        newsService.getRelatedNews(result.id, 3).catch(() => []),
      ]);
      return { article: result, comments, related };
    },
    enabled: !!articleId,
  });

  const article = data?.article ?? null;
  const articleComments = data?.comments ?? [];
  const relatedNews = data?.related ?? [];

  const { isFavorite, toggleFavorite } = useFavorites();

  const [baseUrl, setBaseUrl] = useState('https://sakhcom.ru');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const [clientShareUrl, setClientShareUrl] = useState('');
  const [toast, setToast] = useState<string>('');

  useEffect(() => {
    if (article) {
      setClientShareUrl(window.location.href);
    }
  }, [article]);

  if (isLoading) {
    return (
      <div className="pt-24 pb-8 max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

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

  const tags: string[] = (article.tags || []).map(t => typeof t === 'string' ? t : (t as { tag: { name: string } }).tag?.name || '').filter(Boolean);

  const fav = isFavorite(article.id);
  const readingTime = article.readingTimeMinutes ?? estimateReadingTime(article.content ? JSON.parse(article.content) : null);

  const formattedDate = article.publishedAt ? format(new Date(article.publishedAt), 'd MMMM yyyy, HH:mm', { locale: ru }) : '';
  const formattedUpdate = article.updatedAt ? format(new Date(article.updatedAt), 'd MMMM yyyy, HH:mm', { locale: ru }) : '';
  const showUpdated = article.updatedAt !== article.publishedAt;

  const effectiveShareUrl = clientShareUrl || `${baseUrl}/news/${article.slug}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: `${baseUrl}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category?.name || '',
        item: `${baseUrl}/category/${article.category?.slug || ''}`,
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
      name: article.author?.name || '',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sakhcom',
      logo: `${baseUrl}/logo.png`,
    },
    articleSection: article.category?.name || '',
    about: {
      '@type': 'Place',
      name: article.city,
    },
  };

  let renderedContent = '';
  let htmlContent = '';
  if (article.content) {
    try {
      const parsed = JSON.parse(article.content);
      renderedContent = renderTipTapJson(parsed);
    } catch {
      renderedContent = article.content;
    }
    htmlContent = injectAdAfterParagraph(renderedContent, 4, '<div class="my-6"><div class="w-full h-24 bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--text-muted)]">Реклама</div></div>');
  }

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.lead || undefined}
        image={article.mainImageUrl || undefined}
        url={`/news/${article.slug}`}
        type="article"
        publishedAt={article.publishedAt || undefined}
        updatedAt={article.updatedAt || undefined}
        authorName={article.author?.name || undefined}
      />
      <div className="pt-20 pb-8">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors duration-200 text-[var(--text-secondary)] hover:text-[var(--accent-ocean)]"
        >
          <ArrowLeft size={16} />
          На главную
        </Link>

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
                    to={`/category/${article.category?.slug}`}
                    className="transition-colors hover:text-[var(--accent-ocean)]"
                  >
                    {article.category?.name}
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
                    to={`/category/${article.category?.slug}`}
                    className="sakh-tag sakh-tag--accent hover:bg-[var(--accent-ocean)] hover:text-[var(--bg-primary)] transition-colors"
                  >
                    {article.category?.name}
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
                    {article.author?.avatarUrl ? (
                      <img src={article.author.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono uppercase bg-[var(--bg-surface)] text-[var(--accent-ocean)] shrink-0">
                        {article.author?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {article.author?.name || ''}
                      </div>
                      <div className="text-xs font-mono text-[var(--text-muted)]">
                        {article.author?.role || ''}
                      </div>
                    </div>
                  </address>

                  <div className="flex items-center gap-4">
                    <span className="sakh-meta sakh-meta--with-icon">
                      <Eye size={12} />
                      {(article.viewsCount ?? 0).toLocaleString('ru-RU')}
                    </span>
                    <span className="sakh-meta sakh-meta--with-icon">
                      <MessageSquare size={12} />
                      {article.commentsCount}
                    </span>
                    <span className="sakh-meta sakh-meta--with-icon">
                      <Clock size={12} />
                      {readingTime} мин
                    </span>
                    {article.publishedAt && (
                      <time dateTime={article.publishedAt} className="sakh-meta sakh-meta--with-icon">
                        <Calendar size={12} />
                        {formattedDate}
                      </time>
                    )}
                    <motion.button
                      onClick={() => {
                        toggleFavorite(article.id);
                        setToast(fav ? 'Удалено из избранного' : 'Добавлено в избранное');
                        setTimeout(() => setToast(''), 2000);
                      }}
                      whileTap={{ scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="p-2 transition-colors text-[var(--text-muted)] hover:text-[var(--accent-ocean)]"
                      aria-label={fav ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      <Bookmark size={18} fill={fav ? 'var(--accent-ocean)' : 'none'} />
                    </motion.button>
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
              <div
                className="sakh-prose mb-8"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />

              {/* Share Buttons */}
              <aside aria-label="Поделиться" className="mb-8">
                <ShareButtons url={effectiveShareUrl} title={article.title} />
              </aside>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {tags.map((tag) => (
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
              {showUpdated && article.updatedAt && (
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
            <AdSlot code="<div class='w-full h-64 bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--text-muted)]'>Рекламное место</div>" />
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
    </>
  );
}
