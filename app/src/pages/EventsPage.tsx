import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CalendarDays, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { eventsService } from '@/services/events.service';
import type { ArticleEvent } from '@/services/events.service';

const VIEW_OPTIONS = [
  { value: 'list', label: 'Список' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
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

export default function EventsPage() {
  const [events, setEvents] = useState<ArticleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await eventsService.getAll({ perPage: 50, sort: 'startDate' });
        if (!cancelled) setEvents(res.data || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => {
      const now = new Date();
      return events.filter(e => new Date(e.startDate) >= now).slice(0, 30);
    },
    [events],
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

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setView(opt.value)}
                  className={view === opt.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
            <p className="sakh-body text-[var(--text-secondary)]">Ближайших событий нет</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map(event => (
              <motion.div key={event.id} variants={cardVariants}>
                <Link
                  to={`/event/${event.id}`}
                  className="sakh-card block p-4 group h-full"
                >
                  {event.category && (
                    <span className="sakh-tag sakh-tag--accent inline-flex items-center gap-1 mb-3">
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
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
