import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Plus, ChevronDown } from 'lucide-react';
import { supportTickets, faqItems } from '@/data/accountMock';
import EmptyState from '@/components/EmptyState';

type TabId = 'tickets' | 'faq';

const tabs: { id: TabId; label: string }[] = [
  { id: 'tickets', label: 'Мои обращения' },
  { id: 'faq', label: 'База знаний' },
];

const statusLabels: Record<string, string> = {
  open: 'Открыт',
  closed: 'Закрыт',
  waiting: 'Ожидает ответа',
};

const statusColors: Record<string, string> = {
  open: 'sakh-tag--accent',
  closed: 'sakh-tag--muted',
  waiting: 'sakh-tag--sunset',
};

export default function AccountSupport() {
  const [activeTab, setActiveTab] = useState<TabId>('tickets');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', category: 'problem', message: '' });
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="sakh-tabs">
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
        {activeTab === 'tickets' && (
          <button onClick={() => setShowForm(!showForm)} className="sakh-btn sakh-btn--primary sakh-btn--sm">
            <Plus size={14} />
            Создать
          </button>
        )}
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
          {activeTab === 'tickets' && (
            <>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="sakh-card p-4 overflow-hidden"
                >
                  <h4 className="sakh-caption font-medium mb-4">Новое обращение</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="sakh-caption block mb-1">Тема</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                        className="sakh-input"
                        placeholder="Кратко опишите проблему"
                      />
                    </div>
                    <div>
                      <label className="sakh-caption block mb-1">Категория</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                        className="sakh-select"
                      >
                        <option value="problem">Техническая проблема</option>
                        <option value="payment">Оплата</option>
                        <option value="moderation">Модерация</option>
                        <option value="suggestion">Предложение</option>
                        <option value="other">Другое</option>
                      </select>
                    </div>
                    <div>
                      <label className="sakh-caption block mb-1">Сообщение</label>
                      <textarea
                        value={formData.message}
                        onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                        className="sakh-textarea"
                        placeholder="Подробно опишите вашу проблему..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setShowForm(false)} className="sakh-btn sakh-btn--ghost sakh-btn--sm">
                        Отмена
                      </button>
                      <button className="sakh-btn sakh-btn--primary sakh-btn--sm">
                        Отправить
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {supportTickets.length > 0 ? supportTickets.map(ticket => (
                <div key={ticket.id} className="sakh-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">{ticket.subject}</h4>
                      <p className="sakh-meta text-xs">{ticket.category}</p>
                    </div>
                    <span className={`sakh-tag ${statusColors[ticket.status]}`}>
                      {statusLabels[ticket.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="sakh-meta text-xs">Создан: {ticket.createdAt.slice(0, 10)}</span>
                    <span className="sakh-meta text-xs">Обновлён: {ticket.updatedAt.slice(0, 10)}</span>
                  </div>
                </div>
              )) : (
                <EmptyState
                  title="Нет обращений"
                  description="У вас пока нет открытых обращений в поддержку"
                  icon={<Headphones size={48} />}
                  action={
                    <button onClick={() => setShowForm(true)} className="sakh-btn sakh-btn--primary sakh-btn--sm">
                      Создать обращение
                    </button>
                  }
                />
              )}
            </>
          )}

          {activeTab === 'faq' && (
            <div className="sakh-card divide-y divide-[var(--border-color)]">
              {faqItems.map(item => (
                <div key={item.id}>
                  <button
                    onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                    className="flex items-center justify-between w-full px-4 py-3.5 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    <span className="pr-4">{item.question}</span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[var(--text-muted)] transition-transform ${
                        openFaq === item.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-3.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
