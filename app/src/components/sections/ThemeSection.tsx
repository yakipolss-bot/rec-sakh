import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import { newsService } from '@/services/news.service';
import { useCity } from '@/contexts/useCity';
import NewsCard from '@/components/NewsCard';
import type { NewsArticle } from '@/types';

export default function ThemeSection() {
  const { currentCity } = useCity();
  const { data: articles, loading } = usePolling<NewsArticle[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', perPage: 20, city: currentCity.name });
      return res.data ?? [];
    },
    60000,
  );

  const themeArticles = articles?.filter(a => a.tags?.includes('theme-day')) ?? [];

  if (loading) {
    return (
      <section className="mb-12" aria-label="Тема дня">
        <div className="flex items-center gap-2 mb-6">
          <Sun size={20} className="text-[var(--accent-ocean)]" />
          <h2 className="sakh-heading">Тема дня</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="sakh-skeleton sakh-skeleton--image h-36" />
          ))}
        </div>
      </section>
    );
  }

  if (!themeArticles.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      aria-label="Тема дня"
    >
      <div className="flex items-center gap-2 mb-6">
        <Sun size={20} className="text-[var(--accent-ocean)]" />
        <h2 className="sakh-heading">Тема дня</h2>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="sakh-tag sakh-tag--accent">Городская среда</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themeArticles.map((article, i) => (
          <NewsCard key={article.id} article={article} variant="compact" index={i} />
        ))}
      </div>
    </motion.section>
  );
}
