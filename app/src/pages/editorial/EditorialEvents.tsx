import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Info, Plus, Edit2, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { EventItem } from '@/models/admin/EventItem';

type Tab = 'all' | 'moderation' | 'create';

const tabs: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Все события' },
  { value: 'moderation', label: 'На модерации' },
  { value: 'create', label: 'Создать' },
];

export default function EditorialEvents() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['editorial', 'events'],
    queryFn: () => adminService.getEvents().then(r => (r.data || []) as EventItem[]),
    refetchInterval: 30000,
  });
  const events = Array.isArray(eventsData) ? eventsData : [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', shortDescription: '', date: '', time: '',
    venue: '', city: '', price: '', ticketUrl: '',
  });

  const resetForm = () => {
    setForm({ title: '', description: '', shortDescription: '', date: '', time: '', venue: '', city: '', price: '', ticketUrl: '' });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.date) {
      toast.error('Заполните название и дату');
      return;
    }
    try {
      if (editingId) {
        await adminService.updateEvent(editingId, form);
        toast.success('Событие обновлено');
      } else {
        await adminService.createEvent(form);
        toast.success('Событие создано');
      }
      resetForm();
      setActiveTab('all');
      queryClient.invalidateQueries({ queryKey: ['editorial', 'events'] });
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  const handleEdit = (ev: EventItem) => {
    setForm({
      title: ev.title,
      description: ev.description || '',
      shortDescription: ev.shortDescription || '',
      date: ev.date?.split('T')[0] || ev.date || '',
      time: ev.time || '',
      venue: ev.venue || '',
      city: ev.city || '',
      price: String(ev.price || ''),
      ticketUrl: ev.ticketUrl || '',
    });
    setEditingId(ev.id);
    setActiveTab('create');
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteEvent(id);
      toast.success('Событие удалено');
      queryClient.invalidateQueries({ queryKey: ['editorial', 'events'] });
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handleModerate = async (id: string, status: string) => {
    try {
      await adminService.updateEventStatus(id, status);
      toast.success(`Статус изменён на «${status === 'published' ? 'Опубликовано' : 'Отклонено'}»`);
      queryClient.invalidateQueries({ queryKey: ['editorial', 'events'] });
    } catch {
      toast.error('Ошибка изменения статуса');
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'published': return '#34D399';
      case 'pending': return '#FBBF24';
      case 'rejected': return '#EF4444';
      case 'draft': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'published': return 'Опубликовано';
      case 'pending': return 'На проверке';
      case 'rejected': return 'Отклонено';
      case 'draft': return 'Черновик';
      default: return s;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Афиша</h1>
          <p className="sakh-meta mt-1">Управление событиями</p>
        </div>
        <button
          onClick={() => { resetForm(); setActiveTab('create'); }}
          className="sakh-btn sakh-btn--primary sakh-btn--md"
        >
          <Plus size={14} />
          Создать событие
        </button>
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
          <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">
            {editingId ? 'Редактировать событие' : 'Новое событие'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="sakh-caption block mb-1">Название *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Название события"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Краткое описание</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="Краткое описание"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Описание</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Полное описание события"
                className="sakh-textarea"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sakh-caption block mb-1">Дата *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="sakh-input"
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Время</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="sakh-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sakh-caption block mb-1">Место</label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="Место проведения"
                  className="sakh-input"
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Город</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Южно-Сахалинск"
                  className="sakh-input"
                />
              </div>
            </div>
            <div>
              <label className="sakh-caption block mb-1">Цена</label>
              <input
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="1000 или Бесплатно"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Ссылка на билеты</label>
              <input
                type="url"
                value={form.ticketUrl}
                onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })}
                placeholder="https://example.com/tickets"
                className="sakh-input"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} className="sakh-btn sakh-btn--primary sakh-btn--md">
                <Calendar size={14} /> {editingId ? 'Сохранить' : 'Создать событие'}
              </button>
              {editingId && (
                <button onClick={resetForm} className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab !== 'create' && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--accent-ocean)]" />
            </div>
          ) : events.length === 0 ? (
            <div className="sakh-card p-8 text-center">
              <Info size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <h3 className="sakh-title mb-2">Нет событий</h3>
              <p className="sakh-body text-sm text-[var(--text-secondary)]">
                {activeTab === 'moderation' ? 'Нет событий на модерации' : 'Создайте первое событие'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events
                .filter((ev) => activeTab === 'moderation' ? ev.status === 'pending' : true)
                .map((ev) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sakh-card p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="sakh-title text-sm truncate">{ev.title}</h3>
                          <span
                            className="sakh-tag sakh-tag--sm"
                            style={{ color: statusColor(ev.status), borderColor: statusColor(ev.status) }}
                          >
                            {statusLabel(ev.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                          <span>{ev.date?.split('T')[0] || ev.date}{ev.time ? ` ${ev.time}` : ''}</span>
                          {ev.venue && <span>{ev.venue}</span>}
                          {ev.city && <span>{ev.city}</span>}
                          {ev.price && <span>{ev.price}{typeof ev.price === 'number' ? ' ₽' : ''}</span>}
                          {ev._count?.subscribers !== undefined && (
                            <span>Записалось: {ev._count.subscribers}</span>
                          )}
                        </div>
                          {ev.shortDescription && (
                          <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{ev.shortDescription}</p>
                        )}
                        {ev.ticketUrl && (
                          <a href={ev.ticketUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[var(--accent-ocean)] hover:underline mt-1 inline-block"
                            onClick={e => e.stopPropagation()}
                          >Билеты ↗</a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-3 shrink-0">
                        {ev.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleModerate(ev.id, 'published')}
                              className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-ocean)]"
                              title="Опубликовать"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleModerate(ev.id, 'rejected')}
                              className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                              title="Отклонить"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(ev)}
                          className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5"
                          title="Редактировать"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
