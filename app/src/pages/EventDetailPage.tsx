import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CalendarDays, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { eventsService } from '@/services/events.service';
import type { ArticleEvent } from '@/services/events.service';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<ArticleEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetch() {
      try {
        const data = await eventsService.getById(id);
        if (!cancelled) setEvent(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="pt-24 pb-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="pt-20 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
            <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
              <ArrowLeft size={14} className="inline mr-1" />
              Главная
            </Link>
            <span className="sakh-caption" aria-hidden="true">/</span>
            <Link to="/events" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
              Афиша
            </Link>
            <span className="sakh-caption" aria-hidden="true">/</span>
            <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Событие</span>
          </nav>
          <div className="sakh-empty">
            <h1 className="sakh-empty__title">Событие не найдено</h1>
            <p className="sakh-empty__description">
              Запрашиваемое событие не найдено или было удалено.
            </p>
            <Link to="/events" className="sakh-btn sakh-btn--primary sakh-btn--md">
              К афише
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <Link to="/events" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            Афиша
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">{event.title}</span>
        </nav>

        {event.imageUrl && (
          <div className="aspect-video rounded-xl overflow-hidden mb-6">
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          {event.category && (
            <span className="sakh-tag sakh-tag--accent inline-flex items-center gap-1">
              <Tag size={12} />
              {event.category.name}
            </span>
          )}
          {event.isFree && (
            <span className="sakh-tag" style={{ background: 'var(--accent-ocean-20)', color: 'var(--accent-ocean)' }}>
              Бесплатно
            </span>
          )}
        </div>

        <h1 className="sakh-display mb-6">{event.title}</h1>

        <div className="flex flex-col gap-3 mb-8">
          <span className="sakh-meta sakh-meta--with-icon">
            <CalendarDays size={16} />
            {format(new Date(event.startDate), 'd MMMM yyyy, HH:mm', { locale: ru })}
            {event.endDate && ` — ${format(new Date(event.endDate), 'd MMMM yyyy, HH:mm', { locale: ru })}`}
          </span>
          {event.venueName && (
            <span className="sakh-meta sakh-meta--with-icon">
              <MapPin size={16} />
              {event.venueName}{event.venueAddress ? ` (${event.venueAddress})` : ''}{event.city ? `, ${event.city}` : ''}
            </span>
          )}
          {event.price != null && !event.isFree && (
            <span className="sakh-meta sakh-meta--with-icon">
              <Clock size={16} />
              {event.price} {event.currency}
            </span>
          )}
          {event.organizer && (
            <span className="sakh-meta">Организатор: {event.organizer.name}</span>
          )}
        </div>

        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: event.description }}
        />
      </div>
    </div>
  );
}
