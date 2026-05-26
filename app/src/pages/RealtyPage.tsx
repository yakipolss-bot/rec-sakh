import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Maximize2, Home, Layers, Loader2 } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import SEOHead from '@/components/SEOHead';
import realtyService from '@/services/realty.service';
import type { RealtyItem } from '@/models/realty/RealtyItem';

const REALTY_CITIES = [
  { value: 'yuzhno', label: 'Южно-Сахалинск' },
  { value: 'korsakov', label: 'Корсаков' },
  { value: 'kholmsk', label: 'Холмск' },
  { value: 'nevelsk', label: 'Невельск' },
  { value: 'aniva', label: 'Анива' },
];

const MODE_OPTIONS = [
  { value: 'sale', label: 'Продажа' },
  { value: 'rent', label: 'Аренда' },
  { value: 'newbuild', label: 'Новостройки' },
];

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
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function formatPrice(price: number | null): string {
  if (!price) return 'Цена не указана';
  return price.toLocaleString('ru-RU') + ' ₽';
}

function formatFloor(item: RealtyItem): string {
  if (!item.floor) return '—';
  return item.floorsTotal ? `${item.floor}/${item.floorsTotal}` : `${item.floor} эт.`;
}

export default function RealtyPage() {
  const [mode, setMode] = useState('sale');
  const [city, setCity] = useState<string | null>(null);

  const params: Record<string, string> = { type: mode, perPage: '50' };
  if (city) params.city = city;

  const { data, isLoading } = useQuery({
    queryKey: ['realty', mode, city],
    queryFn: () => realtyService.getAll(params),
  });

  const items = data?.data || [];

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Недвижимость | Сахалин" description="Продажа и аренда недвижимости на Сахалине." />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Недвижимость</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Недвижимость</h1>
          <p className="sakh-body">Квартиры, дома, новостройки на Сахалине</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {MODE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={mode === opt.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <FilterBar options={REALTY_CITIES} selected={city} onChange={setCity} allLabel="Все города" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-ocean)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">
            <p className="text-lg">Объявления не найдены</p>
          </div>
        ) : (
          <motion.div
            key={`${mode}-${city}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {items.map((item) => (
              <motion.div key={item.id} variants={cardVariants}>
                <div className="sakh-card group cursor-pointer h-full">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.images?.[0] || '/images/news-city.jpg'}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="sakh-tag sakh-tag--accent">
                        {MODE_OPTIONS.find(m => m.value === mode)?.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="sakh-title line-clamp-1 mb-1">{item.title}</h3>
                    <div className="sakh-meta sakh-meta--with-icon mb-2">
                      <MapPin size={10} />
                      {item.address || item.city || 'Адрес не указан'}
                    </div>
                    <div className="text-xl font-mono font-bold text-[var(--accent-ocean)] mb-3">{formatPrice(item.price)}</div>
                    <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                      {item.rooms != null && (
                        <span className="flex items-center gap-1">
                          <Home size={14} />
                          {item.rooms} комн.
                        </span>
                      )}
                      {item.areaTotal != null && (
                        <span className="flex items-center gap-1">
                          <Maximize2 size={14} />
                          {Number(item.areaTotal)} м²
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Layers size={14} />
                        {formatFloor(item)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
