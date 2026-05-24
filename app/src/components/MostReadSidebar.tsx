import { Link } from 'react-router-dom';
import { TrendingUp, Eye } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import newsService from '@/services/news.service';
import { useCity } from '@/contexts/useCity';
import type { NewsArticle } from '@/types';

export default function MostReadSidebar() {
  const { currentCity } = useCity();
  const { data: articles, loading } = usePolling<NewsArticle[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', perPage: 20, city: currentCity.name });
      const sorted = (res.data ?? []).sort(
        (a: NewsArticle, b: NewsArticle) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0),
      );
      return sorted.slice(0, 5);
    },
    60000,
  );

  if (loading) {
    return (
      <div className="sakh-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-[var(--accent-ocean)]" />
          <h3 className="sakh-caption">Самое читаемое</h3>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="sakh-skeleton sakh-skeleton--text w-6 h-6" />
              <div className="sakh-skeleton sakh-skeleton--text flex-1 h-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!articles?.length) return null;

  return (
    <div className="sakh-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b-2 border-[var(--accent-ocean)]">
        <TrendingUp size={16} className="text-[var(--accent-ocean)]" />
        <h3 className="sakh-caption font-bold">Самое читаемое</h3>
      </div>
      <div className="divide-y divide-[var(--border-color)]">
        {articles.map((article, idx) => (
          <Link
            key={article.id}
            to={`/news/${article.slug}`}
            className="group flex gap-3 px-4 py-3 hover:bg-[var(--bg-surface)] transition-colors"
          >
            {article.mainImageUrl ? (
              <div className="shrink-0 relative w-20 h-14 overflow-hidden bg-[var(--bg-surface)]">
                <img
                  src={article.mainImageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--accent-ocean)] text-white flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
              </div>
            ) : (
              <span className="shrink-0 w-8 h-8 bg-[var(--accent-ocean)]/10 text-[var(--accent-ocean)] flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-ocean)] transition-colors line-clamp-2">
                {article.title}
              </p>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                <Eye size={10} />
                {(article.viewsCount ?? 0).toLocaleString('ru-RU')}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
