import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'all' | 'moderation' | 'create';

const tabs: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Все события' },
  { value: 'moderation', label: 'На модерации' },
  { value: 'create', label: 'Создать' },
];

export default function EditorialEvents() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', date: '', time: '', venue: '', city: '', price: '',
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Афиша</h1>
          <p className="sakh-meta mt-1">Управление событиями</p>
        </div>
      </div>

      <div className="sakh-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`sakh-tabs__item ${activeTab === tab.value ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sakh-card p-4 max-w-2xl mb-6"
        >
          <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Новое событие</h3>
          <div className="space-y-4">
            <div>
              <label className="sakh-caption block mb-1">Название</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Название события"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Описание</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Описание события"
                className="sakh-textarea"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sakh-caption block mb-1">Дата</label>
                <input
                  type="text"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  placeholder="16 мая"
                  className="sakh-input"
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Время</label>
                <input
                  type="text"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  placeholder="19:00"
                  className="sakh-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sakh-caption block mb-1">Место</label>
                <input
                  type="text"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="Место проведения"
                  className="sakh-input"
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Город</label>
                <input
                  type="text"
                  value={newEvent.city}
                  onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                  placeholder="Южно-Сахалинск"
                  className="sakh-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toast.info('Модуль событий находится в разработке')}
                className="sakh-btn sakh-btn--primary sakh-btn--md"
              >
                <Calendar size={14} /> Создать событие
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab !== 'create' && (
        <div className="sakh-card p-8 text-center">
          <Info size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h3 className="sakh-title mb-2">Модуль афиши скоро появится</h3>
          <p className="sakh-body text-sm text-[var(--text-secondary)]">
            Управление событиями и календарь находятся в разработке.
          </p>
        </div>
      )}
    </div>
  );
}
