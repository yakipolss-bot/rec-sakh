import { useState } from 'react';
import { motion } from 'framer-motion';
import EditorialNewsList from './EditorialNewsList';
import EditorialNewsCreate from './EditorialNewsCreate';
import { FileText } from 'lucide-react';

type Tab = 'list' | 'create';

const tabs: { value: Tab; label: string }[] = [
  { value: 'list', label: 'Все новости' },
  { value: 'create', label: 'Создать' },
];

export default function EditorialNews() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const tabParam = params.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabParam || 'list');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Новости</h1>
          <p className="sakh-meta mt-1">Управление новостными материалами</p>
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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'list' && <EditorialNewsList />}
        {activeTab === 'create' && <EditorialNewsCreate />}
      </motion.div>
    </div>
  );
}
