import { usePolling } from '@/hooks/usePolling';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { newsService } from '@/services/news.service';
import { useCity } from '@/contexts/CityContext';

export default function BreakingTicker() {
  const { currentCity } = useCity();
  const { data: items } = usePolling<{ id: string; slug: string; title: string }[]>(
    async () => {
      const res = await newsService.getNews({ status: 'published', isUrgent: true, perPage: 20, city: currentCity.name });
      return (res.data ?? []).map((a: any) => ({ id: a.id, slug: a.slug, title: a.title }));
    },
    30000,
  );

  if (!items || items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="bg-[var(--accent-sunset)] text-white overflow-hidden">
      <div className="max-w-[var(--container-max)] mx-auto flex items-center">
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-sunset)] brightness-110 text-sm font-bold tracking-wide">
          <Zap size={14} className="animate-pulse" />
          Срочно
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="whitespace-nowrap py-2.5 ticker-scroll flex">
            {doubled.map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                to={`/news/${item.slug}`}
                className="inline-block mx-8 text-sm font-medium hover:underline underline-offset-2 transition"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
