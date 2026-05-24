import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, ChevronRight } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import newsService from '@/services/news.service';
import { useCity } from '@/contexts/useCity';
import NewsCard from '@/components/NewsCard';
import type { NewsArticle } from '@/types';

const CATEGORY_SLUGS = ['obshchestvo', 'ekonomika', 'sport', 'kultura', 'tekhnologii'];

export default function CategorySections() {
  const { currentCity } = useCity();
  const { data: articles, loading } = usePolling<NewsArticle[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', perPage: 50, city: currentCity.name });
      return res.data ?? [];
    },
    60000,
  );

  const categoryMap: Record<string, NewsArticle[]> = {};
  if (articles) {
    for (const slug of CATEGORY_SLUGS) {
      categoryMap[slug] = articles.filter(a => a.category?.slug === slug).slice(0, 4);
    }
  }

  const shown = CATEGORY_SLUGS.filter(s => (categoryMap[s]?.length ?? 0) > 0);

  if (loading) {
    return (
      <>
        {CATEGORY_SLUGS.map((slug, _idx) => (
          <section key={slug} className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="sakh-skeleton sakh-skeleton--heading w-32 h-6" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="sakh-skeleton sakh-skeleton--image h-36" />
              ))}
            </div>
          </section>
        ))}
      </>
    );
  }

  if (!shown.length) return null;

  return (
    <>
      {shown.map((slug, idx) => (
        <motion.section
          key={slug}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className="mb-12"
          aria-label={`Рубрика: ${categoryMap[slug]?.[0]?.category?.name || slug}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sun size={20} className="text-[var(--accent-ocean)]" />
              <h2 className="sakh-heading">{categoryMap[slug]?.[0]?.category?.name || slug}</h2>
            </div>
            <Link to={`/category/${slug}`} className="sakh-link text-sm flex items-center gap-1">
              Все <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryMap[slug]?.map((article, i) => (
              <NewsCard key={article.id} article={article} variant="compact" index={i} />
            ))}
          </div>
        </motion.section>
      ))}
    </>
  );
}
