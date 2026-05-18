import { Calendar, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { events } from '@/data/mock';

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

export default function EventsWidget() {
  return (
    <div className="sakh-card p-4">
      <h3 className="sakh-caption mb-4">
        Афиша
      </h3>
      <div className="space-y-3">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="group cursor-pointer p-3 transition-all"
            style={{ borderLeft: `3px solid ${categoryColors[event.category] || 'var(--accent-ocean)'}` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="sakh-tag" style={{
                backgroundColor: `${categoryColors[event.category]}20`,
                color: categoryColors[event.category],
              }}>
                {categoryLabels[event.category]}
              </span>
            </div>
            <h4 className="text-sm font-medium leading-snug mb-2 line-clamp-2 group-hover:text-[var(--accent-ocean)] transition-colors" style={{ color: 'var(--text-primary)' }}>
              {event.title}
            </h4>
            <div className="flex items-center gap-3 sakh-meta">
              <span className="sakh-meta sakh-meta--with-icon">
                <Calendar size={10} />
                {event.date}
              </span>
              <span className="sakh-meta sakh-meta--with-icon">
                <Clock size={10} />
                {event.time}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="sakh-meta sakh-meta--with-icon">
                <MapPin size={10} />
                {event.city}
              </span>
              <span className="sakh-meta" style={{ color: event.price === 'Бесплатно' ? 'var(--accent-ocean)' : 'var(--text-primary)' }}>
                {event.price}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
