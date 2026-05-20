import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

type TabId = 'my' | 'favorites';

const tabs: { id: TabId; label: string }[] = [
  { id: 'my', label: 'Мои события' },
  { id: 'favorites', label: 'Избранные' },
];

export default function AccountEvents() {
  const [activeTab, setActiveTab] = useState<TabId>('my');

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
          <EmptyState
            title="Модуль событий скоро появится"
            description="Следите за обновлениями — календарь событий Сахалина уже в разработке"
            icon={<Calendar size={48} />}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
