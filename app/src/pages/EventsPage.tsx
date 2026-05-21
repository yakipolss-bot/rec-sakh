import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CalendarDays, Clock, Tag, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { eventsService } from '@/services/events.service';
import apiClient from '@/services/api-client';
import type { ArticleEvent } from '@/services/events.service';

interface EventCategory {
  id: string;
  name: string;
  slug: string;
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

function EventCard({ event }: { event: ArticleEvent }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div variants={cardVariants}>
      <Link
        to={`/event/${event.id}`}
        className="sakh-card block h-full group overflow-hidden"
      >
        {event.imageUrl && !imgError ? (
          <div className="aspect-[16/9] overflow-hidden bg-[var(--bg-surface)]">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] flex items-center justify-center bg-[var(--bg-surface)]">
            <ImageOff size={32} className="text-[var(--text-muted)] opacity-30" />
          </div>
        )}
        <div className="p-4 flex flex-col flex-1">
          {event.category && (
            <span className="sakh-tag sakh-tag--accent inline-flex items-center gap-1 mb-2 self-start">
              <Tag size={10} />
              {event.category.name}
            </span>
          )}
          <h3 className="sakh-title mb-2 group-hover:text-[var(--accent-ocean)] transition-colors">
            {event.title}
          </h3>
          {event.shortDescription && (
            <p className="sakh-meta mb-3 line-clamp-2">{event.shortDescription}</p>
          )}
          <div className="flex flex-col gap-1.5 mt-auto">
            <span className="sakh-meta sakh-meta--with-icon">
              <CalendarDays size={12} />
              {format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', { locale: ru })}
            </span>
            {event.venueName && (
              <span className="sakh-meta sakh-meta--with-icon">
                <MapPin size={12} />
                {event.venueName}{event.city ? `, ${event.city}` : ''}
              </span>
            )}
            <span className="sakh-meta sakh-meta--with-icon">
              <Clock size={12} />
              {event.isFree ? 'Бесплатно' : event.price ? `от ${event.price} ₽` : ''}
            </span>
            {event.ticketUrl && (
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-ocean)]">
                Купить билет ↗
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<ArticleEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const [eventsRes, catRes] = await Promise.all([
          eventsService.getAll({ perPage: 50, sort: 'startDate' }),
          apiClient.get('/categories', { params: { type: 'events' } }).catch(() => ({ data: [] })),
        ]);
        if (!cancelled) {
          setEvents(eventsRes.data || []);
          const catData = Array.isArray(catRes.data) ? catRes.data : [];
          setCategories(catData as EventCategory[]);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    let list = events.filter(e => new Date(e.startDate) >= now);
    if (activeCategory) {
      list = list.filter(e => e.categoryId === activeCategory);
    }
    return list.slice(0, 30);
  }, [events, activeCategory]);

  const displayedCategories = categories.filter(c =>
    ['kino', 'teatr', 'kontserty', 'ekskursii', 'sport', 'vystavki', 'festivali', 'master-klassy', 'detyam', 'obuchenie'].includes(c.slug)
  );

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

        <div className="flex flex-wrap items-center gap-2 mb-6 pb-3 border-b border-[var(--border-color)]">
          <button
            onClick={() => setActiveCategory(null)}
            className={!activeCategory ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
          >
            Все
          </button>
          {displayedCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
            <p className="sakh-body text-[var(--text-secondary)]">
              {activeCategory
                ? 'В этой категории пока нет событий'
                : 'Ближайших событий нет'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
