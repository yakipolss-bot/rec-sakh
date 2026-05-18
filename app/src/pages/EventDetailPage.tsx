import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Eye } from 'lucide-react';
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

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="pt-20 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="sakh-empty">
            <h1 className="sakh-empty__title">Событие не найдено</h1>
            <p className="sakh-empty__description">Возможно, оно было удалено или срок его проведения истёк.</p>
            <Link to="/events" className="sakh-btn sakh-btn--primary sakh-btn--md">
              К афише
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const similar = events.filter(
    e => e.id !== event.id && (e.category === event.category || e.city === event.city)
  ).slice(0, 3);

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
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">
            {event.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative aspect-[16/9] overflow-hidden mb-6 sakh-card">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
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

              <h1 className="sakh-display mb-4">{event.title}</h1>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="sakh-card p-3 flex items-center gap-2">
                  <Calendar size={16} className="text-[var(--accent-ocean)]" />
                  <span className="sakh-body text-[var(--text-primary)]">{event.date}</span>
                </div>
                <div className="sakh-card p-3 flex items-center gap-2">
                  <Clock size={16} className="text-[var(--accent-ocean)]" />
                  <span className="sakh-body text-[var(--text-primary)]">{event.time}</span>
                </div>
                <div className="sakh-card p-3 flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--accent-ocean)]" />
                  <span className="sakh-body text-[var(--text-primary)]">{event.venue}, {event.city}</span>
                </div>
              </div>

              <div className="sakh-card p-4 mb-6">
                <h2 className="sakh-title mb-3">О событии</h2>
                <div className="sakh-prose text-[var(--text-secondary)] leading-relaxed">
                  {event.description}
                </div>
              </div>

              <div className="sakh-card p-4">
                <h3 className="sakh-caption mb-3">Место проведения</h3>
                <div className="bg-[var(--bg-primary)] aspect-[16/9] flex items-center justify-center border border-[var(--border-color)]">
                  <div className="text-center">
                    <MapPin size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
                    <span className="sakh-caption">{event.venue}</span>
                    <p className="sakh-meta mt-1">{event.city}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="sticky top-24 space-y-4"
            >
              <div className="sakh-card p-4">
                <h3 className="sakh-caption mb-4">Билеты</h3>
                <div className="text-2xl font-mono font-bold text-[var(--text-primary)] mb-4">
                  {event.price}
                </div>
                <button className="sakh-btn sakh-btn--primary sakh-btn--lg w-full mb-2">
                  <Ticket size={16} />
                  Купить билет
                </button>
                <p className="sakh-meta text-center text-xs">
                  Возрастное ограничение: {event.ageLimit}
                </p>
              </div>

              <div className="sakh-card p-4">
                <h3 className="sakh-caption mb-3">Подробности</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="sakh-meta">Категория</span>
                    <span className="sakh-meta text-[var(--text-primary)]">{categoryLabels[event.category]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="sakh-meta">Город</span>
                    <span className="sakh-meta text-[var(--text-primary)]">{event.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="sakh-meta">Возраст</span>
                    <span className="sakh-meta text-[var(--text-primary)]">{event.ageLimit}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {similar.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="sakh-heading mb-6">Похожие события</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {similar.map((sim) => (
                <Link key={sim.id} to={`/events/${sim.id}`} className="sakh-card group block">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={sim.image}
                      alt={sim.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className="sakh-tag"
                        style={{
                          backgroundColor: `${categoryColors[sim.category]}20`,
                          color: categoryColors[sim.category],
                          borderColor: `${categoryColors[sim.category]}40`,
                        }}
                      >
                        {categoryLabels[sim.category]}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="sakh-meta sakh-meta--with-icon mb-1">
                      <Calendar size={10} />
                      {sim.date}
                    </div>
                    <h3 className="sakh-title line-clamp-2">{sim.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
