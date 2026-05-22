import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import { newsService } from '@/services/news.service';
import NewsCard from '@/components/NewsCard';
import BentoGrid from '@/components/BentoGrid';
import type { BentoItem } from '@/components/BentoGrid';
import type { NewsArticle } from '@/types';

export default function NewsFeedSection() {
  const { data: articles, loading } = usePolling<NewsArticle[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', perPage: 11 });
      return res.data ?? [];
    },
    30000,
  );

  const feedArticles = articles?.slice(3) ?? [];
  const bentoItems: BentoItem[] = feedArticles.map((article, i) => ({
    id: article.id,
    type: i === 0 ? 'wide' : 'default',
    content: <NewsCard key={article.id} article={article} index={i} />,
  }));

  if (loading) {
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="sakh-heading">Лента новостей</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sakh-skeleton sakh-skeleton--image h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!feedArticles.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="sakh-heading">Лента новостей</h2>
        <Link to="/category/obshchestvo" className="sakh-link text-sm flex items-center gap-1">
          Все новости <ChevronRight size={14} />
        </Link>
      </div>
      <BentoGrid items={bentoItems} />
    </motion.div>
  );
}
