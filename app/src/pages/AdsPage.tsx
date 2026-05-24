import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Eye, Plus, Loader2 } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';
import SEOHead from '@/components/SEOHead';
import { adsService, type Ad } from '@/services/ads.service';

const AD_CATEGORIES = [
  { value: 'realty', label: 'Недвижимость' },
  { value: 'auto', label: 'Авто' },
  { value: 'jobs', label: 'Работа' },
  { value: 'services', label: 'Услуги' },
  { value: 'electronics', label: 'Электроника' },
  { value: 'clothing', label: 'Одежда' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'По дате' },
  { value: 'price_asc', label: 'Цена (возр.)' },
  { value: 'price_desc', label: 'Цена (убыв.)' },
  { value: 'views', label: 'По просмотрам' },
];

function formatPrice(price: number | null): string {
  if (price == null) return '—';
  return price.toLocaleString('ru-RU') + ' ₽';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
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

export default function AdsPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState('date');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { perPage: '50', sort };
        if (category) params.categoryId = category;
        const res = await adsService.getAll(params);
        if (!cancelled) setAds(res.data || []);
      } catch {
        if (!cancelled) setAds([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [category, sort]);

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Объявления | Сахалин" description="Доска объявлений Сахалина. Купить, продать, снять, предложить." />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Объявления</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="sakh-heading mb-2">Объявления</h1>
              <p className="sakh-body">Доска объявлений Сахалина</p>
            </div>
            <Link to="/ads/submit" className="sakh-btn sakh-btn--primary sakh-btn--md">
              <Plus size={16} />
              Подать объявление
            </Link>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <FilterBar options={AD_CATEGORIES} selected={category} onChange={setCategory} />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="sakh-caption">Сортировка:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={sort === opt.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-ocean)]" />
          </div>
        ) : (
          <motion.div
            key={`${category}-${sort}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={ads.length > 0
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : ''
            }
          >
            {ads.length > 0 ? ads.map((ad) => (
              <motion.div key={ad.id} variants={cardVariants}>
                <Link to={`/ads/${ad.id}`} className="sakh-card group block h-full">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={ad.images?.[0] || '/images/news-city.jpg'}
                      alt={ad.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="sakh-tag sakh-tag--outline bg-[var(--bg-secondary)]">
                        {ad.category?.name || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="sakh-title line-clamp-2 mb-2">{ad.title}</h3>
                    <div className="text-lg font-mono font-bold text-[var(--accent-ocean)] mb-3">{formatPrice(ad.price)}</div>
                    <div className="flex items-center justify-between">
                      <span className="sakh-meta sakh-meta--with-icon">
                        <MapPin size={10} />
                        {ad.city || '—'}
                      </span>
                      <span className="sakh-meta sakh-meta--with-icon">
                        <Clock size={10} />
                        {formatDate(ad.createdAt)}
                      </span>
                    </div>
                    <div className="sakh-meta sakh-meta--with-icon mt-1">
                      <Eye size={10} />
                      {ad.viewsCount}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )) : (
              <div className="col-span-full">
                <EmptyState
                  title="Объявлений пока нет"
                  action={
                    <button onClick={() => setCategory(null)} className="sakh-btn sakh-btn--primary sakh-btn--md">
                      Показать все
                    </button>
                  }
                />
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
