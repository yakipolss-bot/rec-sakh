import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import newsService from '@/services/news.service';
import { useCity } from '@/contexts/useCity';
import type { NewsArticle } from '@/types';

export default function VideoSection() {
  const { currentCity } = useCity();
  const { data: articles, loading } = usePolling<NewsArticle[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', perPage: 5, city: currentCity.name });
      return res.data ?? [];
    },
    60000,
  );

  const article = articles?.[1];

  if (loading) {
    return (
      <section className="mb-12" aria-label="Видео дня">
        <div className="flex items-center gap-2 mb-6">
          <Play size={20} className="text-[var(--accent-ocean)]" />
          <h2 className="sakh-heading">Видео дня</h2>
        </div>
        <div className="sakh-skeleton sakh-skeleton--image aspect-video" />
      </section>
    );
  }

  if (!article) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="mb-12"
      aria-label="Видео дня"
    >
      <div className="flex items-center gap-2 mb-6">
        <Play size={20} className="text-[var(--accent-ocean)]" />
        <h2 className="sakh-heading">Видео дня</h2>
      </div>
      <div className="sakh-card overflow-hidden">
        <Link to={`/news/${article.slug}`} className="block group" aria-label={article.title}>
          <div className="relative aspect-video bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden">
            <img
              src={article.mainImageUrl || ''}
              alt={article.title}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-ocean)]/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-[var(--accent-ocean)]/30 transition-all duration-300">
                <Play size={32} className="text-[var(--accent-ocean)] ml-1" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--bg-primary)]/90 to-transparent">
              <h3 className="sakh-title text-white line-clamp-2">{article.title}</h3>
              <p className="sakh-meta text-white/70 mt-1">{article.lead}</p>
            </div>
          </div>
        </Link>
      </div>
    </motion.section>
  );
}
