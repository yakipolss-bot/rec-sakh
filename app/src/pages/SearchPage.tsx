import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, SlidersHorizontal, Eye, MessageSquare,
  Clock, HelpCircle, ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import SEOHead from '@/components/SEOHead';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';
import newsService from '@/services/news.service';
import categoriesService from '@/services/categories.service';
import type { NewsArticle } from '@/types';
import type { Category } from '@/types';

const ITEMS_PER_PAGE = 20;

const dateRanges = [
  { value: 'all', label: 'За всё время' },
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const;

const typeOptions = [
  { value: 'all', label: 'Все' },
  { value: 'text', label: 'Текст' },
  { value: 'video', label: 'Видео' },
  { value: 'gallery', label: 'Фото' },
] as const;

const sortOptions = [
  { value: 'relevance', label: 'Релевантность' },
  { value: 'date', label: 'Дата' },
  { value: 'popularity', label: 'Популярность' },
] as const;

const similarQueriesRecord: Record<string, string[]> = {
  шторм: ['штормовое предупреждение', 'циклон сахалин', 'отмена рейсов', 'паром ванино холмск'],
  транспорт: ['электробусы', 'паром', 'дороги', 'авиабилеты'],
  погода: ['шторм', 'циклон', 'температура', 'снег'],
  спорт: ['футбол', 'сахалин', 'Лига Востока', 'матч'],
  рыба: ['рыболовство', 'минтай', 'корсаков', 'морепродукты'],
};

function getExplainData(article: NewsArticle, q: string) {
  if (!q) return null;
  const lower = q.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return null;

  const titleMatches = words.filter(w => article.title.toLowerCase().includes(w));
  const textContent = `${article.lead} ${article.content}`.toLowerCase();
  const contentMatches = words.filter(w =>
    textContent.includes(w) && !titleMatches.includes(w)
  );

  return {
    titleMatches,
    contentMatches,
    category: article.category?.name || '',
    city: article.city || '',
  };
}

function filterArticles(
  articles: NewsArticle[],
  query: string,
  category: string,
  city: string,
  dateRange: string,
  type: string,
  sort: 'relevance' | 'date' | 'popularity',
): NewsArticle[] {
  let filtered = [...articles];

  if (query) {
    const q = query.toLowerCase();
    const queryWords = q.split(/\s+/).filter(w => w.length > 1);
    if (queryWords.length) {
      filtered = filtered.filter(a => {
        const text = `${a.title} ${a.lead} ${a.content} ${(a.tags || []).map(t => typeof t === 'string' ? t : (t as { tag: { name: string } }).tag?.name || '').join(' ')}`.toLowerCase();
        return queryWords.some(w => text.includes(w));
      });
    }
  }

  if (category !== 'all') {
    filtered = filtered.filter(a => a.category?.slug === category);
  }

  if (city !== 'Все') {
    filtered = filtered.filter(a => a.city === city);
  }

  if (dateRange !== 'all') {
    const now = new Date();
    const cutoff = new Date();
    if (dateRange === 'today') cutoff.setDate(now.getDate() - 1);
    else if (dateRange === 'week') cutoff.setDate(now.getDate() - 7);
    else if (dateRange === 'month') cutoff.setDate(now.getDate() - 30);
    filtered = filtered.filter(a => a.publishedAt ? new Date(a.publishedAt) >= cutoff : false);
  }

  if (type !== 'all') {
    if (type === 'video') filtered = filtered.filter(a => a.hasVideo);
    else if (type === 'gallery') filtered = filtered.filter(a => a.hasGallery);
    else if (type === 'text') filtered = filtered.filter(a => !a.hasVideo && !a.hasGallery);
  }

  if (sort === 'date') {
    filtered.sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime());
  } else if (sort === 'popularity') {
    filtered.sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0));
  }

  return filtered;
}

function computeFacetCount(
  articles: NewsArticle[],
  query: string,
  category: string,
  city: string,
  dateRange: string,
  type: string,
  overrideCategory: string,
): number {
  return articles.filter(a => {
    if (query) {
      const q = query.toLowerCase();
      const words = q.split(/\s+/).filter(w => w.length > 1);
      if (words.length) {
        const text = `${a.title} ${a.lead} ${a.content} ${(a.tags || []).map(t => typeof t === 'string' ? t : (t as { tag: { name: string } }).tag?.name || '').join(' ')}`.toLowerCase();
        if (!words.some(w => text.includes(w))) return false;
      }
    }
    if (overrideCategory !== 'all' && a.category?.slug !== overrideCategory) return false;
    if (city !== 'Все' && a.city !== city) return false;
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === 'today') cutoff.setDate(now.getDate() - 1);
      else if (dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      else if (dateRange === 'month') cutoff.setDate(now.getDate() - 30);
      if (a.publishedAt && new Date(a.publishedAt) < cutoff) return false;
    }
    if (type !== 'all') {
      if (type === 'video' && !a.hasVideo) return false;
      if (type === 'gallery' && !a.hasGallery) return false;
      if (type === 'text' && (a.hasVideo || a.hasGallery)) return false;
    }
    return true;
  }).length;
}

function computeCityCount(
  articles: NewsArticle[],
  query: string,
  category: string,
  city: string,
  dateRange: string,
  type: string,
  overrideCity: string,
): number {
  return articles.filter(a => {
    if (query) {
      const q = query.toLowerCase();
      const words = q.split(/\s+/).filter(w => w.length > 1);
      if (words.length) {
        const text = `${a.title} ${a.lead} ${a.content} ${(a.tags || []).map(t => typeof t === 'string' ? t : (t as { tag: { name: string } }).tag?.name || '').join(' ')}`.toLowerCase();
        if (!words.some(w => text.includes(w))) return false;
      }
    }
    if (category !== 'all' && a.category?.slug !== category) return false;
    if (overrideCity !== 'Все' && a.city !== overrideCity) return false;
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateRange === 'today') cutoff.setDate(now.getDate() - 1);
      else if (dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      else if (dateRange === 'month') cutoff.setDate(now.getDate() - 30);
      if (a.publishedAt && new Date(a.publishedAt) < cutoff) return false;
    }
    if (type !== 'all') {
      if (type === 'video' && !a.hasVideo) return false;
      if (type === 'gallery' && !a.hasGallery) return false;
      if (type === 'text' && (a.hasVideo || a.hasGallery)) return false;
    }
    return true;
  }).length;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SearchPage({ q: propQ }: { q?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const newsQuery = useQuery({
    queryKey: ['news', 'published'],
    queryFn: () => newsService.getNews({ status: 'published' }),
    select: (data) => data.data || [],
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getCategories(),
  });

  const newsArticles = newsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const isLoading = newsQuery.isLoading || categoriesQuery.isLoading;

  const [query, setQuery] = useState(propQ || searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(propQ || searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'Все');
  const [selectedDateRange, setSelectedDateRange] = useState(searchParams.get('date') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'popularity'>(
    (searchParams.get('sort') as 'relevance' | 'date' | 'popularity') || 'relevance',
  );

  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [searchKey, setSearchKey] = useState(0);
  const [explainId, setExplainId] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const facetButtonRef = useRef<HTMLButtonElement>(null);

  const allCities = useMemo(() => {
    const set = new Set(newsArticles.map(a => a.city).filter(Boolean) as string[]);
    return ['Все', ...Array.from(set).sort()];
  }, [newsArticles]);

  const results = useMemo(
    () => filterArticles(newsArticles, debouncedQuery, selectedCategory, selectedCity, selectedDateRange, selectedType, sortBy),
    [newsArticles, debouncedQuery, selectedCategory, selectedCity, selectedDateRange, selectedType, sortBy],
  );

  const displayedResults = useMemo(() => results.slice(0, displayCount), [results, displayCount]);
  const hasMore = displayCount < results.length;

  const hasActiveFilters = selectedCategory !== 'all' || selectedCity !== 'Все'
    || selectedDateRange !== 'all' || selectedType !== 'all';

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: results.length };
    for (const cat of categories) {
      counts[cat.slug] = computeFacetCount(
        newsArticles, debouncedQuery, selectedCategory, selectedCity,
        selectedDateRange, selectedType, cat.slug,
      );
    }
    return counts;
  }, [newsArticles, categories, debouncedQuery, selectedCategory, selectedCity, selectedDateRange, selectedType, results.length]);

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Все': results.length };
    for (const city of allCities) {
      if (city === 'Все') continue;
      counts[city] = computeCityCount(
        newsArticles, debouncedQuery, selectedCategory, selectedCity,
        selectedDateRange, selectedType, city,
      );
    }
    return counts;
  }, [newsArticles, debouncedQuery, selectedCategory, selectedCity, selectedDateRange, selectedType, allCities, results.length]);

  const suggestions = useMemo(() => {
    if (query.length < 2) return { news: [] as { text: string; slug: string }[], tags: [] as string[] };
    const q = query.toLowerCase();
    const titles = newsArticles
      .filter(a => a.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map(a => ({ text: a.title, slug: a.slug }));
    const tags = Array.from(new Set(newsArticles.flatMap(a => {
      const t = (a.tags || []).map(tag => typeof tag === 'string' ? tag : (tag as { tag: { name: string } }).tag?.name || '');
      return t.filter(Boolean);
    })))
      .filter(t => t.toLowerCase().includes(q))
      .slice(0, 3);
    return { news: titles, tags };
  }, [query, newsArticles]);

  const hasSuggestions = suggestions.news.length > 0 || suggestions.tags.length > 0;

  const currentSimilarQueries = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    for (const [key, queries] of Object.entries(similarQueriesRecord)) {
      if (q.includes(key) || key.includes(q)) return queries;
    }
    return ['шторм', 'транспорт', 'погода', 'спорт', 'Корсаков', 'рыболовство'];
  }, [debouncedQuery]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
      setDisplayCount(ITEMS_PER_PAGE);
    }, 150);
    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedCity !== 'Все') params.set('city', selectedCity);
    if (selectedDateRange !== 'all') params.set('date', selectedDateRange);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, selectedCategory, selectedCity, selectedDateRange, selectedType, sortBy, setSearchParams]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [query]);

  useEffect(() => {
    if (!showAutocomplete) {
      setActiveSuggestionIndex(-1);
    }
  }, [showAutocomplete]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = useCallback((value: string) => {
    setQuery(value);
    setDebouncedQuery(value);
    setSearchKey(k => k + 1);
    setDisplayCount(ITEMS_PER_PAGE);
    setShowAutocomplete(false);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2) setShowAutocomplete(true);
    if (!value) setShowAutocomplete(false);
  }, []);

  const handleSuggestionClick = useCallback((text: string) => {
    setQuery(text);
    setDebouncedQuery(text);
    setSearchKey(k => k + 1);
    setDisplayCount(ITEMS_PER_PAGE);
    setShowAutocomplete(false);
  }, []);

  const handleSuggestionKeyDown = useCallback((e: React.KeyboardEvent) => {
    const allItems = [...suggestions.news, ...suggestions.tags.map(t => ({ text: t, slug: '' }))];
    if (!allItems.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(allItems[activeSuggestionIndex].text);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  }, [suggestions, activeSuggestionIndex, handleSuggestionClick]);

  const clearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedCity('Все');
    setSelectedDateRange('all');
    setSelectedType('all');
    setSortBy('relevance');
  }, []);

  const handleLoadMore = useCallback(() => {
    setDisplayCount(c => c + ITEMS_PER_PAGE);
  }, []);

  const toggleExplain = useCallback((id: string) => {
    setExplainId(current => current === id ? null : id);
  }, []);

  const handleSimilarClick = useCallback((term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    setSearchKey(k => k + 1);
    setDisplayCount(ITEMS_PER_PAGE);
  }, []);

  const handleSortChange = useCallback((value: 'relevance' | 'date' | 'popularity') => {
    setSortBy(value);
    setDisplayCount(ITEMS_PER_PAGE);
  }, []);

  if (isLoading) {
    return (
      <main className="pt-24 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <SEOHead
        title={`Поиск${query ? `: ${query}` : ''}`}
        description={query ? `Результаты поиска по запросу «${query}» — Sakhcom` : 'Поиск новостей на Sakhcom'}
        url={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}
      />
      <main className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-6">Поиск</h1>

          <div
            className="relative max-w-2xl"
            ref={autocompleteRef}
            onKeyDown={handleSuggestionKeyDown}
          >
            <SearchBar
              key={searchKey}
              value={query}
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
              placeholder="Найти на Сахалине..."
              autoFocus
            />

            <AnimatePresence>
              {showAutocomplete && hasSuggestions && query.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1 z-50 max-h-80 overflow-y-auto bg-[var(--bg-secondary)] border border-[color:var(--border-color)]"
                  role="listbox"
                  aria-label="Подсказки поиска"
                >
                  {suggestions.news.length > 0 && (
                    <>
                      <div className="sakh-caption px-4 pt-3 pb-1.5">Новости</div>
                      {suggestions.news.map((s, i) => (
                        <button
                          key={`news-${s.slug}`}
                          onClick={() => handleSuggestionClick(s.text)}
                          onMouseEnter={() => setActiveSuggestionIndex(i)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center gap-2 text-[var(--text-primary)] ${
                            activeSuggestionIndex === i ? 'bg-[var(--bg-surface)]' : ''
                          }`}
                          role="option"
                          aria-selected={activeSuggestionIndex === i}
                        >
                          <Search size={12} className="text-[var(--text-muted)]" />
                          <span className="truncate">{s.text}</span>
                          <span className="ml-auto sakh-caption text-[10px]">новость</span>
                        </button>
                      ))}
                    </>
                  )}

                  {suggestions.news.length > 0 && suggestions.tags.length > 0 && (
                    <div className="h-px mx-4 bg-[var(--border-color)]" />
                  )}

                  {suggestions.tags.length > 0 && (
                    <>
                      <div className="sakh-caption px-4 pt-3 pb-1.5">Теги</div>
                      {suggestions.tags.map((t, i) => {
                        const globalIdx = suggestions.news.length + i;
                        return (
                          <button
                            key={`tag-${t}`}
                            onClick={() => handleSuggestionClick(t)}
                            onMouseEnter={() => setActiveSuggestionIndex(globalIdx)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center gap-2 text-[var(--text-primary)] ${
                              activeSuggestionIndex === globalIdx ? 'bg-[var(--bg-surface)]' : ''
                            }`}
                            role="option"
                            aria-selected={activeSuggestionIndex === globalIdx}
                          >
                            <Search size={12} className="text-[var(--text-muted)]" />
                            <span>{t}</span>
                            <span className="ml-auto sakh-caption text-[10px]">тег</span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              ref={facetButtonRef}
              onClick={() => setShowFilters(s => !s)}
              className={`sakh-btn sakh-btn--sm ${showFilters ? 'sakh-btn--primary' : 'sakh-btn--ghost'}`}
              aria-expanded={showFilters}
              aria-controls="facet-panel"
              aria-label="Показать фильтры"
            >
              <SlidersHorizontal size={14} />
              Фильтры
              {hasActiveFilters && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    showFilters ? 'bg-[var(--bg-primary)]' : 'bg-[var(--accent-ocean)]'
                  }`}
                />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                aria-label="Сбросить фильтры"
              >
                <X size={12} />
                Сбросить
              </button>
            )}
          </div>

          <nav aria-label="Сортировка результатов">
            <div className="flex items-center gap-1">
              <span className="sakh-caption mr-1">Сортировка:</span>
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className={`sakh-filter-bar__item ${
                    sortBy === opt.value ? 'sakh-filter-bar__item--active' : ''
                  }`}
                  aria-pressed={sortBy === opt.value}
                  aria-label={`Сортировать по ${opt.label.toLowerCase()}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Facet Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              id="facet-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden mb-6"
            >
              <div
                className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 bg-[var(--bg-secondary)] border border-[color:var(--border-color)]"
              >
                {/* Category */}
                <div>
                  <label className="sakh-caption block mb-2">Рубрика</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="sakh-select"
                    aria-label="Фильтр по рубрике"
                  >
                    <option value="all">Все ({categoryCounts.all})</option>
                    {categories.map(c => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} ({categoryCounts[c.slug]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="sakh-caption block mb-2">Город</label>
                  <select
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                    className="sakh-select"
                    aria-label="Фильтр по городу"
                  >
                    {allCities.map(c => (
                      <option key={c} value={c}>
                        {c} ({cityCounts[c]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="sakh-caption block mb-2">Дата</label>
                  <div className="flex flex-wrap gap-1.5">
                    {dateRanges.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setSelectedDateRange(d.value)}
                        className={`sakh-filter-bar__item ${
                          selectedDateRange === d.value ? 'sakh-filter-bar__item--active' : ''
                        }`}
                        aria-pressed={selectedDateRange === d.value}
                        aria-label={`Фильтр: ${d.label}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="sakh-caption block mb-2">Тип</label>
                  <div className="flex flex-wrap gap-1.5">
                    {typeOptions.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setSelectedType(t.value)}
                        className={`sakh-filter-bar__item ${
                          selectedType === t.value ? 'sakh-filter-bar__item--active' : ''
                        }`}
                        aria-pressed={selectedType === t.value}
                        aria-label={`Фильтр: ${t.label}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        {(debouncedQuery || hasActiveFilters) && (
          <p className="sakh-caption mb-4">
            Найдено {results.length}{' '}
            {results.length === 1 ? 'результат' : results.length < 5 ? 'результата' : 'результатов'}
            {debouncedQuery && (
              <> по запросу &laquo;{debouncedQuery}&raquo;</>
            )}
          </p>
        )}

        {/* Results / Zero State */}
        <AnimatePresence mode="wait">
          {results.length > 0 ? (
            <motion.div
              key="results"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-4"
            >
              {displayedResults.map(article => {
                const explain = getExplainData(article, debouncedQuery);
                const dateStr = article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), {
                  addSuffix: true,
                  locale: ru,
                }) : '';

                return (
                  <motion.div
                    key={article.id}
                    variants={itemVariants}
                    className="sakh-card p-5 cursor-pointer group relative"
                  >
                    <Link
                      to={`/news/${article.slug}`}
                      className="block"
                      aria-label={article.title}
                    >
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                        {article.isUrgent && (
                          <span className="sakh-tag sakh-tag--sunset">⚡ Срочно</span>
                        )}
                        {article.hasVideo && (
                          <span className="sakh-tag sakh-tag--accent">[ВИДЕО]</span>
                        )}
                        {article.hasGallery && (
                          <span className="sakh-tag sakh-tag--accent">[ФОТО]</span>
                        )}
                        {article.isPremium && (
                          <span className="sakh-tag sakh-tag--accent">[ВАЖНО]</span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="sakh-meta sakh-meta--accent">
                          {article.category?.name || ''}
                        </span>
                        <span className="sakh-meta">{article.city}</span>
                        {article.publishedAt && (
                          <span className="sakh-meta sakh-meta--with-icon">
                            <Clock size={10} />
                            {dateStr}
                          </span>
                        )}
                        <span className="sakh-meta sakh-meta--with-icon">
                          <Eye size={12} />
                          {(article.viewsCount ?? 0).toLocaleString('ru-RU')}
                        </span>
                        <span className="sakh-meta sakh-meta--with-icon">
                          <MessageSquare size={12} />
                          {article.commentsCount}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="sakh-title line-clamp-2 mb-2">
                        {article.title}
                      </h3>

                      {/* Lead */}
                      <p className="sakh-body text-sm line-clamp-2">
                        {article.lead}
                      </p>
                    </Link>

                    {/* Explainability */}
                    {explain && (
                      <div className="mt-3 flex items-start gap-2">
                        <button
                          onClick={e => {
                            e.preventDefault();
                            toggleExplain(article.id);
                          }}
                          className="flex items-center gap-1 text-[11px] font-mono transition-colors text-[var(--text-muted)]"
                          aria-label="Почему этот результат"
                          aria-expanded={explainId === article.id}
                        >
                          <HelpCircle size={12} />
                          Почему
                        </button>

                        <AnimatePresence>
                          {explainId === article.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="text-[11px] p-2.5 space-y-1 bg-[var(--bg-surface)] border border-[color:var(--border-color)] text-[var(--text-secondary)]"
                            >
                              {explain.titleMatches.length > 0 && (
                                <p>
                                  Совпадение в заголовке:{' '}
                                  <span className="text-[var(--accent-ocean)]">
                                    {explain.titleMatches.map(t => `«${t}»`).join(', ')}
                                  </span>
                                </p>
                              )}
                              {explain.contentMatches.length > 0 && (
                                <p>
                                  Совпадение в тексте:{' '}
                                  <span className="text-[var(--accent-ocean)]">
                                    {explain.contentMatches.map(t => `«${t}»`).join(', ')}
                                  </span>
                                </p>
                              )}
                              <p>Категория: {explain.category}</p>
                              <p>Город: {explain.city}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="zero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState
                icon={<Search size={48} />}
                title="Ничего не найдено"
                description={
                  debouncedQuery
                    ? `По запросу "${debouncedQuery}" не найдено результатов. Попробуйте изменить поисковый запрос или сбросить фильтры.`
                    : 'Начните вводить поисковый запрос или измените параметры фильтров.'
                }
                action={
                  hasActiveFilters ? (
                    <button
                      onClick={clearFilters}
                      className="sakh-btn sakh-btn--primary sakh-btn--sm"
                    >
                      Сбросить фильтры
                    </button>
                  ) : undefined
                }
              />

              {debouncedQuery && (
                <div className="flex flex-col items-center -mt-4 pb-12">
                  <p className="sakh-caption mb-3">Попробуйте:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['шторм', 'транспорт', 'погода', 'спорт', 'Корсаков'].map(term => (
                      <button
                        key={term}
                        onClick={() => handleSimilarClick(term)}
                        className="sakh-filter-bar__item hover:text-[var(--accent-ocean)] hover:border-[var(--accent-ocean)]"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-8 mb-4">
            <button
              onClick={handleLoadMore}
              className="sakh-btn sakh-btn--secondary sakh-btn--md"
              aria-label={`Загрузить ещё ${Math.min(ITEMS_PER_PAGE, results.length - displayCount)} результатов`}
            >
              <ChevronDown size={14} />
              Загрузить ещё {Math.min(ITEMS_PER_PAGE, results.length - displayCount)}
            </button>
          </div>
        )}

        {/* Similar Queries */}
        {results.length > 0 && currentSimilarQueries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-12 pt-8 border-t border-[color:var(--border-color)]"
          >
            <h2 className="sakh-caption mb-4">Похожие запросы</h2>
            <div className="flex flex-wrap gap-2">
              {currentSimilarQueries.map(term => (
                <button
                  key={term}
                  onClick={() => handleSimilarClick(term)}
                  className="sakh-filter-bar__item hover:text-[var(--accent-ocean)] hover:border-[var(--accent-ocean)]"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
    </>
  );
}
