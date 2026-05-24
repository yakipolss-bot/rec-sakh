import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import eventsService from '@/services/events.service';
import type { Event as ArticleEvent } from '@/models/events/Event';

function WidgetEventCard({ event }: { event: ArticleEvent }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      key={event.id}
      to={`/event/${event.id}`}
      className="block group"
    >
      <div className="flex gap-3">
        {event.imageUrl && !imgError ? (
          <div className="w-14 h-14 shrink-0 rounded overflow-hidden bg-[var(--bg-surface)]">
            <img
              src={event.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-14 h-14 shrink-0 rounded flex items-center justify-center bg-[var(--bg-surface)]">
            <ImageOff size={16} className="text-[var(--text-muted)] opacity-30" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-ocean)] transition-colors line-clamp-2 leading-snug mb-1">
            {event.title}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{format(new Date(event.startDate), 'd MMM', { locale: ru })}</span>
            {event.city && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5"><MapPin size={10} />{event.city}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function EventsWidget() {
  const [events, setEvents] = useState<ArticleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await eventsService.getAll({ perPage: 4, sort: 'startDate' });
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sakh-card p-4"
    >
      <Link to="/events" className="flex items-center justify-between mb-4 group">
        <h3 className="sakh-caption group-hover:text-[var(--accent-ocean)] transition-colors">
          Афиша
        </h3>
        <span className="text-xs text-[var(--accent-ocean)]">все →</span>
      </Link>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Calendar size={28} className="text-[var(--text-muted)] mb-2" />
          <p className="sakh-meta">Событий пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <WidgetEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
