import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, XCircle, Eye, BarChart3, MessageSquare } from 'lucide-react';

type Tab = 'moderation' | 'categories' | 'stats';

const tabs: { value: Tab; label: string }[] = [
  { value: 'moderation', label: 'На модерации' },
  { value: 'categories', label: 'Все категории' },
  { value: 'stats', label: 'Статистика' },
];

const mockPendingAds = [
  { id: 'a1', title: 'Продам Toyota Camry 2020', author: 'Иван С.', category: 'Авто', date: '15.05.2026', status: 'pending' },
  { id: 'a2', title: 'Сдам 2-комнатную квартиру', author: 'Ольга М.', category: 'Недвижимость', date: '15.05.2026', status: 'pending' },
  { id: 'a3', title: 'Ищу работу водителем', author: 'Дмитрий К.', category: 'Работа', date: '14.05.2026', status: 'pending' },
  { id: 'a4', title: 'Ремонт квартир под ключ', author: 'Андрей С.', category: 'Услуги', date: '14.05.2026', status: 'pending' },
  { id: 'a5', title: 'Продам щенков хаски', author: 'Елена В.', category: 'Животные', date: '13.05.2026', status: 'pending' },
];

const adCategories = [
  { name: 'Авто', count: 45 },
  { name: 'Недвижимость', count: 32 },
  { name: 'Работа', count: 28 },
  { name: 'Услуги', count: 56 },
  { name: 'Животные', count: 12 },
  { name: 'Электроника', count: 23 },
  { name: 'Одежда', count: 18 },
  { name: 'Детские товары', count: 15 },
];

export default function EditorialAds() {
  const [activeTab, setActiveTab] = useState<Tab>('moderation');

  return (
    <div>
      <h1 className="sakh-heading mb-2">Объявления</h1>
      <p className="sakh-meta mb-6">Управление пользовательскими объявлениями</p>

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

      {activeTab === 'moderation' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="px-3 py-2 text-left sakh-caption">Объявление</th>
                <th className="px-3 py-2 text-left sakh-caption">Автор</th>
                <th className="px-3 py-2 text-left sakh-caption">Категория</th>
                <th className="px-3 py-2 text-left sakh-caption">Дата</th>
                <th className="px-3 py-2 sakh-caption">Действия</th>
              </tr>
            </thead>
            <tbody>
              {mockPendingAds.map((ad, i) => (
                <motion.tr
                  key={ad.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="px-3 py-3 text-[var(--text-primary)]">{ad.title}</td>
                  <td className="px-3 py-3 sakh-meta">{ad.author}</td>
                  <td className="px-3 py-3">
                    <span className="sakh-tag sakh-tag--outline">{ad.category}</span>
                  </td>
                  <td className="px-3 py-3 sakh-meta">{ad.date}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-ocean)]" title="Одобрить">
                        <CheckCircle size={14} />
                      </button>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]" title="Отклонить">
                        <XCircle size={14} />
                      </button>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5" title="Просмотр">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {adCategories.map((cat) => (
            <div key={cat.name} className="sakh-card p-4 flex items-center justify-between">
              <span className="text-sm text-[var(--text-primary)]">{cat.name}</span>
              <span className="font-mono text-xs text-[var(--accent-ocean)]">{cat.count}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="sakh-card p-4"
          >
            <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Общая статистика</h3>
            <div className="space-y-3">
              {[
                { icon: DollarSign, label: 'Всего объявлений', value: '229' },
                { icon: BarChart3, label: 'Активных', value: '187' },
                { icon: Eye, label: 'Просмотров сегодня', value: '3 247' },
                { icon: MessageSquare, label: 'Откликов сегодня', value: '45' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                  <div className="flex items-center gap-2">
                    <stat.icon size={14} className="text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
                  </div>
                  <span className="font-mono text-sm text-[var(--text-primary)]">{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="sakh-card p-4"
          >
            <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Популярные категории</h3>
            <div className="space-y-2">
              {adCategories.slice(0, 5).map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="text-[var(--text-secondary)]">{cat.name}</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">{cat.count}</span>
                  </div>
                  <div className="sakh-progress">
                    <div className="sakh-progress__bar" style={{
                      width: `${(cat.count / Math.max(...adCategories.map((c) => c.count))) * 100}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
