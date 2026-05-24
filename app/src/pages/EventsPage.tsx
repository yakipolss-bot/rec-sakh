import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CalendarDays, Clock, Tag, ImageOff } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { eventsService } from '@/services/events.service';
import apiClient from '@/services/api-client';
import type { ArticleEvent } from '@/services/events.service';
import SEOHead from '@/components/SEOHead';

interface EventCategory {
  id: string;
  name: string;
  slug: string;
}

interface DayGroup {
  date: string;
  label: string;
  events: ArticleEvent[];
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 24;

  // Load categories once
  useEffect(() => {
    apiClient.get('/categories', { params: { type: 'events' } })
      .then(res => { setCategories(Array.isArray(res.data) ? res.data : res.data?.data || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const eventsRes = await eventsService.getAll({
          perPage: pageSize,
          page,
          sort: 'startDate',
          dateFrom: now.toISOString(),
          ...(activeCategory ? { categoryId: activeCategory } : {}),
        });
        if (!cancelled) {
          if (page === 1) {
            setEvents(eventsRes.data || []);
          } else {
            setEvents(prev => [...prev, ...(eventsRes.data || [])]);
          }
          setHasMore(eventsRes.meta?.totalPages > page);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [page, activeCategory]);

  const filtered = useMemo(() => {
    if (activeCategory) return events;
    return events;
  }, [events, activeCategory]);

  const dayGroups: DayGroup[] = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const groups: DayGroup[] = [];
    for (const ev of sorted) {
      const d = new Date(ev.startDate);
      const dateKey = format(d, 'yyyy-MM-dd');
      const existing = groups.find(g => g.date === dateKey);
      if (existing) {
        existing.events.push(ev);
      } else {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        let label: string;
        if (isSameDay(d, today)) {
          label = 'Сегодня';
        } else if (isSameDay(d, tomorrow)) {
          label = 'Завтра';
        } else {
          label = format(d, 'd MMMM', { locale: ru });
        }
        groups.push({ date: dateKey, label, events: [ev] });
      }
    }
    return groups;
  }, [filtered]);

  const displayedCategories = categories.filter(c =>
    ['kino', 'teatr', 'kontserty', 'ekskursii', 'sport', 'vystavki', 'festivali', 'master-klassy', 'detyam', 'obuchenie'].includes(c.slug)
  );

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="События | Сахалин" description="Афиша мероприятий Сахалина. Концерты, спектакли, выставки, фестивали." />
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
            onClick={() => { setActiveCategory(null); setPage(1); }}
            className={!activeCategory ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
          >
            Все
          </button>
          {displayedCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setPage(1); }}
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
          <div className="space-y-8">
            {dayGroups.map((group, gi) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05, duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-base font-medium text-[var(--text-primary)]">{group.label}</h2>
                  <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
                    {format(new Date(group.date), 'EEEE', { locale: ru })}
                  </span>
                  <span className="flex-1 h-px bg-[var(--border-color)]" />
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{group.events.length} событ{group.events.length === 1 ? 'ие' : group.events.length < 5 ? 'ия' : 'ий'}</span>
                </div>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {group.events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
        {hasMore && !loading && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setPage(p => p + 1)}
              className="sakh-btn sakh-btn--outline sakh-btn--md"
            >
              Загрузить ещё
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
