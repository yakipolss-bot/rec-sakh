import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, List, Grid3X3, MapPin, Clock, ArrowLeft } from 'lucide-react';
import { events } from '@/data/mock';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';
import type { Event } from '@/types';

const VIEW_OPTIONS = [
  { value: 'list', label: 'Список' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
];

const CATEGORY_OPTIONS = [
  { value: 'cinema', label: 'Кино' },
  { value: 'theatre', label: 'Театр' },
  { value: 'concert', label: 'Концерты' },
  { value: 'exhibition', label: 'Выставки' },
  { value: 'sport', label: 'Спорт' },
  { value: 'festival', label: 'Фестивали' },
];

const categoryColors: Record<string, string> = {
  cinema: 'var(--accent-ocean)',
  theatre: 'var(--accent-sunset)',
  concert: '#A78BFA',
  exhibition: 'var(--accent-ocean)',
  sport: '#34D399',
  festival: 'var(--accent-sunset)',
};

const categoryLabels: Record<string, string> = {
  cinema: 'Кино',
  theatre: 'Театр',
  concert: 'Концерт',
  exhibition: 'Выставка',
  sport: 'Спорт',
  festival: 'Фестиваль',
};

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

export default function EventsPage() {
  const [view, setView] = useState('list');
  const [category, setCategory] = useState<string | null>(null);

  const filtered = category
    ? events.filter(e => e.category === category)
    : events;

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Афиша</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Афиша</h1>
          <p className="sakh-body">События Сахалина: концерты, спектакли, выставки и спорт</p>
        </motion.div>

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setView(opt.value)}
                  className={view === opt.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
                >
                  {opt.value === 'list' && <List size={12} className="inline mr-1" />}
                  {opt.value === 'week' && <CalendarDays size={12} className="inline mr-1" />}
                  {opt.value === 'month' && <Grid3X3 size={12} className="inline mr-1" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <FilterBar
            options={CATEGORY_OPTIONS}
            selected={category}
            onChange={setCategory}
          />
        </div>

        <motion.div
          key={`${category}-${view}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={filtered.length > 0
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : ''
          }
        >
          {filtered.length > 0 ? filtered.map((event) => (
            <motion.div key={event.id} variants={cardVariants}>
              <Link to={`/events/${event.id}`} className="sakh-card group block h-full">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="sakh-tag"
                      style={{
                        backgroundColor: `${categoryColors[event.category]}20`,
                        color: categoryColors[event.category],
                        borderColor: `${categoryColors[event.category]}40`,
                      }}
                    >
                      {categoryLabels[event.category]}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="sakh-caption text-[var(--accent-ocean)] font-bold text-lg">
                      {event.date}
                    </span>
                  </div>
                  <h3 className="sakh-title line-clamp-2 mb-3">{event.title}</h3>
                  <div className="flex flex-col gap-1 mb-3">
                    <span className="sakh-meta sakh-meta--with-icon">
                      <Clock size={12} />
                      {event.time}
                    </span>
                    <span className="sakh-meta sakh-meta--with-icon">
                      <MapPin size={12} />
                      {event.venue}, {event.city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="sakh-meta text-[var(--text-primary)] font-medium">
                      {event.price}
                    </span>
                    <span className="sakh-meta">{event.ageLimit}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )) : (
            <div className="col-span-full">
              <EmptyState
                title="Событий пока нет"
                description="В этой категории пока нет предстоящих событий"
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
