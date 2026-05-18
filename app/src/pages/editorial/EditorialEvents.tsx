import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Edit, Trash2, Plus, CheckCircle, XCircle, Eye } from 'lucide-react';
import { events } from '@/data/mock';
import { editorialEvents } from '@/data/editorialMock';
import type { Event } from '@/types';

type Tab = 'all' | 'moderation' | 'create';

const tabs: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Все события' },
  { value: 'moderation', label: 'На модерации' },
  { value: 'create', label: 'Создать' },
];

const categoryLabels: Record<string, string> = {
  exhibition: 'Выставка',
  concert: 'Концерт',
  sport: 'Спорт',
  festival: 'Фестиваль',
  theatre: 'Театр',
  cinema: 'Кино',
};

export default function EditorialEvents() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', date: '', time: '', venue: '', city: '', price: '',
  });

  const allEvents = events as (Event & { status?: string })[];

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
              <button className="sakh-btn sakh-btn--primary sakh-btn--md">
                <Calendar size={14} /> Создать событие
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab !== 'create' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="px-3 py-2 text-left sakh-caption">Событие</th>
                <th className="px-3 py-2 text-left sakh-caption">Категория</th>
                <th className="px-3 py-2 text-left sakh-caption">Дата</th>
                <th className="px-3 py-2 text-left sakh-caption">Статус</th>
                <th className="px-3 py-2 sakh-caption">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'moderation' ? editorialEvents.filter((e) => e.status === 'moderation') : editorialEvents).map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="px-3 py-3 text-[var(--text-primary)]">{e.title}</td>
                  <td className="px-3 py-3 sakh-meta">{categoryLabels[e.category] || e.category}</td>
                  <td className="px-3 py-3 sakh-meta">{e.date}</td>
                  <td className="px-3 py-3">
                    <span className={`sakh-tag ${
                      e.status === 'published' ? 'sakh-tag--accent' :
                      e.status === 'moderation' ? 'sakh-tag--sunset' : 'sakh-tag--muted'
                    }`}>
                      {e.status === 'published' ? 'Опубликовано' :
                       e.status === 'moderation' ? 'На модерации' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5">
                        <Edit size={14} />
                      </button>
                      {e.status === 'moderation' && (
                        <>
                          <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-ocean)]">
                            <CheckCircle size={14} />
                          </button>
                          <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]">
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
