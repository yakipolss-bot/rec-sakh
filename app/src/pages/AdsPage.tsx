import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Eye, Plus } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';

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

interface Ad {
  id: string;
  title: string;
  price: string;
  city: string;
  date: string;
  category: string;
  views: number;
  image: string;
}

const mockAds: Ad[] = [
  { id: 'a1', title: 'Продам Toyota Camry 2020', price: '2 800 000 ₽', city: 'Южно-Сахалинск', date: '16 мая', category: 'auto', views: 234, image: '/images/news-city.jpg' },
  { id: 'a2', title: 'Сдам 2-комнатную квартиру', price: '35 000 ₽/мес', city: 'Корсаков', date: '15 мая', category: 'realty', views: 156, image: '/images/news-city.jpg' },
  { id: 'a3', title: 'Требуется водитель категории C', price: '80 000 ₽', city: 'Южно-Сахалинск', date: '15 мая', category: 'jobs', views: 89, image: '/images/news-city.jpg' },
  { id: 'a4', title: 'Ремонт холодильников на дому', price: 'от 1 500 ₽', city: 'Холмск', date: '14 мая', category: 'services', views: 45, image: '/images/news-city.jpg' },
  { id: 'a5', title: 'iPhone 15 Pro Max новый', price: '95 000 ₽', city: 'Южно-Сахалинск', date: '14 мая', category: 'electronics', views: 312, image: '/images/news-city.jpg' },
  { id: 'a6', title: 'Зимняя куртка, размер 48', price: '4 500 ₽', city: 'Невельск', date: '13 мая', category: 'clothing', views: 67, image: '/images/news-city.jpg' },
  { id: 'a7', title: 'Продам 1-комнатную квартиру', price: '4 200 000 ₽', city: 'Южно-Сахалинск', date: '12 мая', category: 'realty', views: 198, image: '/images/news-city.jpg' },
  { id: 'a8', title: 'Услуги электрика', price: 'от 1 000 ₽', city: 'Долинск', date: '12 мая', category: 'services', views: 34, image: '/images/news-city.jpg' },
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
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function AdsPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState('date');

  const filtered = category
    ? mockAds.filter(a => a.category === category)
    : [...mockAds];

  switch (sort) {
    case 'price_asc': filtered.sort((a, b) => parseInt(a.price.replace(/\D/g, '')) - parseInt(b.price.replace(/\D/g, ''))); break;
    case 'price_desc': filtered.sort((a, b) => parseInt(b.price.replace(/\D/g, '')) - parseInt(a.price.replace(/\D/g, ''))); break;
    case 'views': filtered.sort((a, b) => b.views - a.views); break;
    default: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return (
    <div className="pt-20 pb-8">
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

        <motion.div
          key={`${category}-${sort}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={filtered.length > 0
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : ''
          }
        >
          {filtered.length > 0 ? filtered.map((ad) => (
            <motion.div key={ad.id} variants={cardVariants}>
              <Link to={`/ads/${ad.id}`} className="sakh-card group block h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={ad.image}
                    alt={ad.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="sakh-tag sakh-tag--outline bg-[var(--bg-secondary)]">
                      {AD_CATEGORIES.find(c => c.value === ad.category)?.label}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="sakh-title line-clamp-2 mb-2">{ad.title}</h3>
                  <div className="text-lg font-mono font-bold text-[var(--accent-ocean)] mb-3">{ad.price}</div>
                  <div className="flex items-center justify-between">
                    <span className="sakh-meta sakh-meta--with-icon">
                      <MapPin size={10} />
                      {ad.city}
                    </span>
                    <span className="sakh-meta sakh-meta--with-icon">
                      <Clock size={10} />
                      {ad.date}
                    </span>
                  </div>
                  <div className="sakh-meta sakh-meta--with-icon mt-1">
                    <Eye size={10} />
                    {ad.views}
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
      </div>
    </div>
  );
}
