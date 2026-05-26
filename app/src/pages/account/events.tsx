import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock } from 'lucide-react';
import eventsService from '@/services/events.service';
import EmptyState from '@/components/EmptyState';
import type { Event } from '@/models/events/Event';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type TabId = 'all' | 'my';

const tabs: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Все события' },
  { id: 'my', label: 'Мои события' },
];

export default function AccountEvents() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await eventsService.getAll({ perPage: 20, sort: 'startDate' });
        if (!cancelled) {
          setEvents(res.data || []);
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sakh-tabs mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`sakh-tabs__item ${activeTab === tab.id ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'all' && (
            events.length === 0 ? (
              <EmptyState title="Нет событий" description="События появятся здесь после добавления" icon={<Calendar size={48} />} />
            ) : (
              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="sakh-card p-4 flex items-start gap-4">
                    {event.imageUrl && (
                      <img src={event.imageUrl} alt="" className="w-20 h-20 object-cover shrink-0 hidden sm:block" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[var(--text-primary)]">{event.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="sakh-meta text-xs flex items-center gap-1">
                          <Calendar size={10} />
                          {format(new Date(event.startDate), 'd MMM yyyy', { locale: ru })}
                        </span>
                        <span className="sakh-meta text-xs flex items-center gap-1">
                          <Clock size={10} />
                          {format(new Date(event.startDate), 'HH:mm', { locale: ru })}
                        </span>
                        {event.venueName && (
                          <span className="sakh-meta text-xs flex items-center gap-1">
                            <MapPin size={10} />
                            {event.venueName}
                          </span>
                        )}
                        {event.price != null && (
                          <span className="sakh-tag sakh-tag--accent text-xs">{event.price} {event.currency}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'my' && (
            <EmptyState
              title="Мои события"
              description="События, на которые вы записались, появятся здесь"
              icon={<Calendar size={48} />}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
