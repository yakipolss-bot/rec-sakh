import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, Phone, Heart, MoreVertical, TrendingUp, Star, Clock, Trash2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

type TabId = 'active' | 'archive' | 'moderation';

const tabs: { id: TabId; label: string }[] = [
  { id: 'active', label: 'Активные' },
  { id: 'archive', label: 'Архив' },
  { id: 'moderation', label: 'На модерации' },
];

const ads = {
  active: [
    { id: 'a1', title: 'Продам Toyota Camry 2020', price: '2 500 000 ₽', city: 'Южно-Сахалинск', date: '2026-05-15', status: 'active', views: 342, calls: 12, favorites: 5 },
    { id: 'a2', title: 'Сдам 1-к квартиру на Сахалинской', price: '35 000 ₽/мес', city: 'Южно-Сахалинск', date: '2026-05-10', status: 'active', views: 891, calls: 28, favorites: 15 },
  ],
  archive: [
    { id: 'a3', title: 'Продам iPhone 14 Pro', price: '70 000 ₽', city: 'Корсаков', date: '2026-04-20', status: 'archived', views: 1200, calls: 45, favorites: 22 },
  ],
  moderation: [] as { id: string; title: string; price: string; city: string; date: string; status: string; views: number; calls: number; favorites: number }[],
};

export default function AccountAds() {
  const [activeTab, setActiveTab] = useState<TabId>('active');

  const currentAds = ads[activeTab];

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
        <button className="sakh-btn sakh-btn--primary sakh-btn--sm">
          + Подать
        </button>
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
          {currentAds.length > 0 ? currentAds.map(ad => (
            <div key={ad.id} className="sakh-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1 line-clamp-1">{ad.title}</h4>
                  <p className="text-lg font-mono font-medium text-[var(--accent-ocean)]">{ad.price}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Поднять">
                    <TrendingUp size={14} />
                  </button>
                  <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Выделить">
                    <Star size={14} />
                  </button>
                  <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Срочно">
                    <Clock size={14} />
                  </button>
                  <button className="sakh-btn sakh-btn--ghost sakh-btn--sm text-[var(--accent-sunset)]" title="Удалить">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="sakh-meta">{ad.city}</span>
                <span className="sakh-meta">{ad.date}</span>
                <span className="sakh-meta sakh-meta--with-icon">
                  <Eye size={10} />
                  {ad.views}
                </span>
                <span className="sakh-meta sakh-meta--with-icon">
                  <Phone size={10} />
                  {ad.calls}
                </span>
                <span className="sakh-meta sakh-meta--with-icon">
                  <Heart size={10} />
                  {ad.favorites}
                </span>
                {ad.status === 'active' && (
                  <span className="sakh-tag sakh-tag--accent">Активно</span>
                )}
                {ad.status === 'archived' && (
                  <span className="sakh-tag sakh-tag--muted">В архиве</span>
                )}
              </div>
            </div>
          )) : (
            <EmptyState
              title={
                activeTab === 'active' ? 'Нет активных объявлений' :
                activeTab === 'archive' ? 'Архив пуст' : 'Объявлений на модерации нет'
              }
              description={
                activeTab === 'active' ? 'Подайте первое объявление' :
                activeTab === 'archive' ? 'В архиве пока нет объявлений' : 'Нет объявлений, ожидающих проверки'
              }
              icon={<FileText size={48} />}
              action={
                <button className="sakh-btn sakh-btn--primary sakh-btn--sm">Подать объявление</button>
              }
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
