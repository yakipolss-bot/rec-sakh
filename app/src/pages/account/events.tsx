import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Heart } from 'lucide-react';
import { events } from '@/data/mock';
import EmptyState from '@/components/EmptyState';

type TabId = 'my' | 'favorites';

const tabs: { id: TabId; label: string }[] = [
  { id: 'my', label: 'Мои события' },
  { id: 'favorites', label: 'Избранные' },
];

const favoriteEvents = [] as typeof events;

export default function AccountEvents() {
  const [activeTab, setActiveTab] = useState<TabId>('my');

  const visibleEvents = activeTab === 'my' ? events : favoriteEvents;

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
          className="space-y-3"
        >
          {visibleEvents.length > 0 ? visibleEvents.map(event => (
            <div key={event.id} className="sakh-card p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">{event.title}</h4>
                <span className="sakh-tag sakh-tag--outline text-xs">{event.category}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{event.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="sakh-meta sakh-meta--with-icon">
                  <Calendar size={10} />
                  {event.date} в {event.time}
                </span>
                <span className="sakh-meta sakh-meta--with-icon">
                  <MapPin size={10} />
                  {event.venue}, {event.city}
                </span>
                <span className="sakh-meta">{event.price}</span>
              </div>
            </div>
          )) : (
            <EmptyState
              title={activeTab === 'my' ? 'Нет событий' : 'Нет избранных событий'}
              description={activeTab === 'my' ? 'Вы ещё не добавили ни одного события' : 'Добавляйте события в избранное, чтобы они появились здесь'}
              icon={<Calendar size={48} />}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
