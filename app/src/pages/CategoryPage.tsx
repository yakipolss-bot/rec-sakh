import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Grid3X3, List, RotateCcw, TrendingUp, MapPin, Calendar } from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import FilterBar from '@/components/FilterBar';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import { newsService } from '@/services/news.service';
import { categoriesService } from '@/services/categories.service';
import type { NewsArticle } from '@/types';
import type { Category } from '@/types';

const SORT_OPTIONS = [
  { value: 'date', label: 'По дате' },
  { value: 'views', label: 'По просмотрам' },
  { value: 'comments', label: 'По комментариям' },
  { value: 'popularity', label: 'По популярности' },
];

const CITIES = [
  { value: 'yuzhno-sakhalinsk', label: 'Южно-Сахалинск' },
  { value: 'korsakov', label: 'Корсаков' },
  { value: 'kholmsk', label: 'Холмск' },
  { value: 'okha', label: 'Оха' },
  { value: 'nevelsk', label: 'Невельск' },
];

const DATE_RANGES = [
  { value: 'all', label: 'За всё время' },
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
];

const ITEMS_PER_PAGE = 12;

function formatSakhalinTime(): string {
  const now = new Date();
  const sakhalin = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Sakhalin',
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  return sakhalin;
}

function isWithinDateRange(dateStr: string, range: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const sakhalinOffset = 11 * 60 * 60 * 1000;
  const dateSakhalin = new Date(date.getTime() + sakhalinOffset);
  const nowSakhalin = new Date(now.getTime() + sakhalinOffset);

  switch (range) {
    case 'today':
      return dateSakhalin.toDateString() === nowSakhalin.toDateString();
    case 'week': {
      const weekAgo = new Date(nowSakhalin.getTime() - 7 * 24 * 60 * 60 * 1000);
      return dateSakhalin >= weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(nowSakhalin.getTime() - 30 * 24 * 60 * 60 * 1000);
      return dateSakhalin >= monthAgo;
    }
    default:
      return true;
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function CategoryPage({ slug: propSlug }: { slug?: string }) {
  const params = useParams<{ slug: string }>();
  const slug = propSlug || params.slug;
  const [searchParams, setSearchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [baseArticles, setBaseArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      try {
        const [catsData, newsData] = await Promise.all([
          categoriesService.getCategories(),
          slug ? newsService.getNews({ category: slug }) : newsService.getNews({ status: 'published' }),
        ]);
        if (cancelled) return;
        setCategories(catsData);
        setBaseArticles(newsData.data || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [slug]);

  const sortBy = searchParams.get('sort') || 'date';
  const city = searchParams.get('city') || 'all';
  const dateRange = searchParams.get('date') || 'all';
  const view = searchParams.get('view') || 'grid';
  const page = parseInt(searchParams.get('page') || '1');

  const category = categories.find(c => c.slug === slug);

  const filteredArticles = useMemo(() => {
    let result = [...baseArticles];

    if (city !== 'all') {
      const cityLabel = CITIES.find(c => c.value === city)?.label || '';
      result = result.filter(a => a.city === cityLabel);
    }

    if (dateRange !== 'all') {
      result = result.filter(a => isWithinDateRange(a.publishedAt || '', dateRange));
    }

    switch (sortBy) {
      case 'views':
        result.sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0));
        break;
      case 'comments':
        result.sort((a, b) => b.commentsCount - a.commentsCount);
        break;
      case 'popularity':
        result.sort((a, b) => ((b.viewsCount ?? 0) * 3 + b.commentsCount * 3) - ((a.viewsCount ?? 0) * 3 + a.commentsCount * 3));
        break;
      default:
        result.sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime());
    }

    return result;
  }, [baseArticles, sortBy, city, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ITEMS_PER_PAGE));
  const clampedPage = Math.min(page, totalPages);
  const paginatedArticles = filteredArticles.slice((clampedPage - 1) * ITEMS_PER_PAGE, clampedPage * ITEMS_PER_PAGE);

  const popularInCategory = useMemo(() => {
    return [...baseArticles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [baseArticles]);

  const hasActiveFilters = city !== 'all' || dateRange !== 'all' || sortBy !== 'date';

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === 'all' || value === 'date' || value === 'grid') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    if (updates.sort || updates.city || updates.date || updates.view) {
      next.delete('page');
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (clampedPage !== page) {
      const next = new URLSearchParams(searchParams);
      if (clampedPage === 1) {
        next.delete('page');
      } else {
        next.set('page', String(clampedPage));
      }
      setSearchParams(next, { replace: true });
    }
  }, [clampedPage, page, searchParams, setSearchParams]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  }, [clampedPage]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    baseArticles.forEach(a => {
      const tags = (a.tags || []).map(t => typeof t === 'string' ? t : (t as { tag: { name: string } }).tag?.name || '');
      tags.forEach(t => { if (t) tagSet.add(t); });
    });
    return Array.from(tagSet).slice(0, 12);
  }, [baseArticles]);

  if (loading) {
    return (
      <div className="pt-24 pb-8 max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link
            to="/"
            className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]"
          >
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">
            {category?.name || 'Все новости'}
          </span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="sakh-heading mb-2">
                {category?.name || 'Все новости'}
              </h1>
              {category && (
                <p className="sakh-body">{category.description}</p>
              )}
            </div>
            <time
              className="sakh-meta shrink-0 mt-1"
              dateTime={new Date().toISOString()}
            >
              {formatSakhalinTime()}, UTC+11
            </time>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <TrendingUp size={14} className="text-[var(--text-muted)]" />
              <span className="sakh-caption mr-1">Сортировка:</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateParams({ sort: opt.value })}
                  className={sortBy === opt.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
                  aria-label={`Сортировать: ${opt.label}`}
                  aria-current={sortBy === opt.value ? 'true' : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateParams({ view: 'grid' })}
                className={`p-2 transition-colors ${view === 'grid' ? 'text-[var(--accent-ocean)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                aria-label="Вид сеткой"
                aria-current={view === 'grid' ? 'true' : undefined}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => updateParams({ view: 'list' })}
                className={`p-2 transition-colors ${view === 'list' ? 'text-[var(--accent-ocean)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                aria-label="Вид списком"
                aria-current={view === 'list' ? 'true' : undefined}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[var(--text-muted)]" />
              <span className="sakh-caption">Город:</span>
              <select
                value={city}
                onChange={(e) => updateParams({ city: e.target.value })}
                className="sakh-select !w-auto !text-xs !py-1 !px-2"
                aria-label="Фильтр по городу"
              >
                <option value="all">Все</option>
                {CITIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--text-muted)]" />
              <span className="sakh-caption">Дата:</span>
              <FilterBar
                options={DATE_RANGES.slice(1)}
                selected={dateRange === 'all' ? null : dateRange}
                onChange={(val) => updateParams({ date: val })}
                allLabel="За всё время"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="sakh-meta">
            Найдено {filteredArticles.length} новостей
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="sakh-tag sakh-tag--outline cursor-pointer"
              aria-label="Сбросить все фильтры"
            >
              <RotateCcw size={12} />
              Сбросить фильтры
            </button>
          )}
        </div>

        <div className="flex gap-8">
          <main className="flex-1 min-w-0" ref={contentRef} tabIndex={-1}>
            <AnimatePresence mode="wait">
              {paginatedArticles.length > 0 ? (
                <motion.div
                  key={`${view}-${clampedPage}-${sortBy}-${city}-${dateRange}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={view === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-3'
                  }
                >
                  {paginatedArticles.map((article, i) => (
                    <motion.div key={article.id} variants={cardVariants}>
                      <NewsCard
                        article={article}
                        variant={view === 'list' ? 'compact' : 'default'}
                        index={i}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <EmptyState
                    title="Новостей пока нет"
                    description={hasActiveFilters
                      ? 'Попробуйте изменить параметры фильтров'
                      : 'В этой рубрике ещё нет материалов'
                    }
                    action={
                      <Link to="/" className="sakh-btn sakh-btn--primary sakh-btn--md">
                        На главную
                      </Link>
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {totalPages > 1 && (
              <motion.div
                key={clampedPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="mt-8 flex justify-center"
              >
                <Pagination
                  currentPage={clampedPage}
                  totalPages={totalPages}
                  onPageChange={(p) => updateParams({ page: String(p) })}
                />
              </motion.div>
            )}
          </main>

          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sakh-card p-4 mb-4">
              <h3 className="sakh-caption mb-3 text-[var(--text-secondary)]">
                Популярное в рубрике
              </h3>
              <div className="space-y-3">
                {popularInCategory.slice(0, 5).map((article, i) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.slug}`}
                    className="flex gap-3 group"
                  >
                    <span className="sakh-meta sakh-meta--accent font-bold tabular-nums w-5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug line-clamp-2 text-[var(--text-primary)] group-hover:text-[var(--accent-ocean)] transition-colors">
                        {article.title}
                      </p>
                      <span className="sakh-meta mt-1 block">
                        {(article.viewsCount ?? 0).toLocaleString('ru-RU')} просмотров
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="sakh-card p-4">
                <h3 className="sakh-caption mb-3 text-[var(--text-secondary)]">
                  Теги
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="sakh-tag sakh-tag--outline hover:sakh-tag--accent transition-all"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
