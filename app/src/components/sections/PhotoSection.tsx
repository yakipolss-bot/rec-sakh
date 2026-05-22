import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import { newsService } from '@/services/news.service';
import { useCity } from '@/contexts/useCity';
import type { NewsArticle } from '@/types';

export default function PhotoSection() {
  const { currentCity } = useCity();
  const { data: articles, loading } = usePolling<NewsArticle[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', perPage: 5, city: currentCity.name });
      return res.data ?? [];
    },
    60000,
  );

  const article = articles?.[2];

  if (loading) {
    return (
      <section className="mb-12" aria-label="Фото дня">
        <div className="flex items-center gap-2 mb-6">
          <Camera size={20} className="text-[var(--accent-ocean)]" />
          <h2 className="sakh-heading">Фото дня</h2>
        </div>
        <div className="sakh-skeleton sakh-skeleton--image aspect-video" />
      </section>
    );
  }

  if (!article) return null;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="mb-12"
      aria-label="Фото дня"
    >
      <div className="flex items-center gap-2 mb-6">
        <Camera size={20} className="text-[var(--accent-ocean)]" />
        <h2 className="sakh-heading">Фото дня</h2>
      </div>
      <div className="sakh-card overflow-hidden group">
        <Link to={`/news/${article.slug}`} className="block" aria-label={article.title}>
          <div className="overflow-hidden">
            <img
              src={article.mainImageUrl || ''}
              alt={article.title}
              className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="p-4">
            <h3 className="sakh-title mb-2">{article.title}</h3>
            <div className="flex items-center gap-4 sakh-meta">
              <span>{article.city}</span>
              <span>{article.author?.name}</span>
              <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ru-RU') : ''}</span>
            </div>
          </div>
        </Link>
      </div>
    </motion.section>
  );
}
