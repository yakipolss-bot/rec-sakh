import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Megaphone, TrendingUp, MousePointerClick,
  DollarSign, Eye, Layout,
} from 'lucide-react';

type AdTab = 'campaigns' | 'placements' | 'clients' | 'stats';

const tabs: { key: AdTab; label: string }[] = [
  { key: 'campaigns', label: 'Кампании' },
  { key: 'placements', label: 'Места' },
  { key: 'clients', label: 'Клиенты' },
  { key: 'stats', label: 'Статистика' },
];

export default function AdminAdvertising() {
  const { section } = useParams();
  const sectionToTab: Record<string, AdTab> = { campaigns: 'campaigns', placements: 'placements', clients: 'clients', stats: 'stats' };
  const [tab, setTab] = useState<AdTab>((section && sectionToTab[section]) || 'campaigns');

  useEffect(() => {
    if (section && sectionToTab[section]) setTab(sectionToTab[section]);
  }, [section]);

  return (
    <div className="space-y-6">
      <h1 className="sakh-heading">Реклама</h1>

      <div className="sakh-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`sakh-tabs__item ${tab === t.key ? 'sakh-tabs__item--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'campaigns' && (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Название</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Клиент</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Место</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Бюджет</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Потрачено</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Показы</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Клики</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">CTR</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={9} className="text-center py-8"><p className="sakh-meta">Нет рекламных кампаний</p></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'placements' && (
        <div className="sakh-card p-6 text-center">
          <div className="sakh-empty">
            <Layout size={48} className="sakh-empty__icon" />
            <h3 className="sakh-empty__title">Нет рекламных мест</h3>
            <p className="sakh-empty__description">Рекламные места появятся после настройки модуля.</p>
          </div>
        </div>
      )}

      {tab === 'clients' && (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Клиент</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Кампании</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Бюджет</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Потрачено</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="text-center py-8"><p className="sakh-meta">Нет клиентов</p></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: 'Показы', value: '0', suffix: '' },
            { icon: MousePointerClick, label: 'Клики', value: '0', suffix: '' },
            { icon: TrendingUp, label: 'CTR', value: '0', suffix: '%' },
            { icon: DollarSign, label: 'Доход', value: '0', suffix: ' ₽' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[var(--accent-ocean-20)]">
                  <stat.icon size={18} className="text-[var(--accent-ocean)]" />
                </div>
                <span className="sakh-caption">{stat.label}</span>
              </div>
              <p className="sakh-title text-xl">{stat.value}{stat.suffix}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
