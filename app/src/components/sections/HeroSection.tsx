import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Eye, MessageSquare } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import { newsService } from '@/services/news.service';
import { useCity } from '@/contexts/CityContext';
import type { NewsArticle } from '@/types';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HeroSection() {
  const { currentCity } = useCity();
  const { data: articles, loading } = usePolling<NewsArticle[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', perPage: 3, city: currentCity.name });
      return res.data ?? [];
    },
    30000,
  );

  if (loading) {
    return (
      <section className="mb-12" aria-label="Главные новости">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <div className="sakh-skeleton sakh-skeleton--image h-[400px]" />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="sakh-skeleton sakh-skeleton--image h-[190px]" />
            <div className="sakh-skeleton sakh-skeleton--image h-[190px]" />
          </div>
        </div>
      </section>
    );
  }

  if (!articles?.length) return null;

  const [hero, ...rest] = articles;

  return (
    <section className="mb-12" aria-label="Главные новости">
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        <motion.div variants={itemVariants} className="lg:col-span-7">
          <article className="sakh-card group cursor-pointer h-full flex flex-col">
            <Link to={`/news/${hero.slug}`} className="flex flex-col h-full" aria-label={hero.title}>
              <div className="relative aspect-[16/9] lg:aspect-[16/10] overflow-hidden">
                <img
                  src={hero.mainImageUrl || ''}
                  alt={hero.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
                {hero.isUrgent && (
                  <div className="absolute top-4 left-4 sakh-tag bg-[var(--accent-sunset)] text-white flex items-center gap-1.5">
                    <Zap size={12} />
                    Срочно
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="sakh-meta sakh-meta--accent">{hero.category?.name}</span>
                  <span className="sakh-meta">{hero.city}</span>
                </div>
                <h1 className="sakh-display mb-3 line-clamp-3">{hero.title}</h1>
                <p className="sakh-body mb-4 line-clamp-2">{hero.lead}</p>
                <div className="mt-auto flex items-center gap-4">
                  <span className="sakh-meta sakh-meta--with-icon">
                    <Eye size={12} />
                    {(hero.viewsCount ?? 0).toLocaleString('ru-RU')}
                  </span>
                  <span className="sakh-meta sakh-meta--with-icon">
                    <MessageSquare size={12} />
                    {hero.commentsCount}
                  </span>
                  <span className="sakh-meta">{hero.readingTimeMinutes} мин</span>
                </div>
              </div>
            </Link>
          </article>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-4">
          {rest.map((article, i) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 * (i + 1) }}
              className="sakh-card group cursor-pointer flex-1"
            >
              <Link to={`/news/${article.slug}`} className="flex flex-col sm:flex-row h-full" aria-label={article.title}>
                <div className="sm:w-2/5 shrink-0 overflow-hidden">
                  <img
                    src={article.mainImageUrl || ''}
                    alt={article.title}
                    className="w-full h-full object-cover aspect-video sm:aspect-auto transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="sakh-meta sakh-meta--accent">{article.category?.name}</span>
                  </div>
                  <h3 className="text-base font-medium leading-snug line-clamp-3 mb-2 flex-1 text-[var(--text-primary)]">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-auto">
                    <span className="sakh-meta sakh-meta--with-icon">
                      <Eye size={10} />
                      {(article.viewsCount ?? 0).toLocaleString('ru-RU')}
                    </span>
                    <span className="sakh-meta sakh-meta--with-icon">
                      <MessageSquare size={10} />
                      {article.commentsCount}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
