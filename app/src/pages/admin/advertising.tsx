import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, TrendingUp, MousePointerClick,
  DollarSign, Eye, Layout,
} from 'lucide-react';
import { adCampaigns, adPlacements } from '@/data/adminMock';

type AdTab = 'campaigns' | 'placements' | 'clients' | 'stats';

const tabs: { key: AdTab; label: string }[] = [
  { key: 'campaigns', label: 'Кампании' },
  { key: 'placements', label: 'Места' },
  { key: 'clients', label: 'Клиенты' },
  { key: 'stats', label: 'Статистика' },
];

const statusBadge: Record<string, string> = {
  active: 'sakh-tag--accent',
  paused: 'sakh-tag--sunset',
  completed: 'sakh-tag--outline',
};

const statusLabels: Record<string, string> = {
  active: 'Активна',
  paused: 'Пауза',
  completed: 'Завершена',
};

const placementStatusBadge: Record<string, string> = {
  active: 'sakh-tag--accent',
  inactive: 'sakh-tag--outline',
};

const clients = (() => {
  const map = new Map<string, { name: string; campaigns: number; totalBudget: number; totalSpent: number }>();
  adCampaigns.forEach(c => {
    const existing = map.get(c.client);
    if (existing) {
      existing.campaigns++;
      existing.totalBudget += c.budget;
      existing.totalSpent += c.spent;
    } else {
      map.set(c.client, { name: c.client, campaigns: 1, totalBudget: c.budget, totalSpent: c.spent });
    }
  });
  return Array.from(map.values());
})();

const totalStats = (() => {
  const totals = adCampaigns.reduce((acc, c) => ({
    impressions: acc.impressions + c.impressions,
    clicks: acc.clicks + c.clicks,
    spent: acc.spent + c.spent,
  }), { impressions: 0, clicks: 0, spent: 0 });
  return {
    ...totals,
    ctr: totals.impressions > 0 ? +((totals.clicks / totals.impressions) * 100).toFixed(2) : 0,
  };
})();

export default function AdminAdvertising() {
  const [tab, setTab] = useState<AdTab>('campaigns');

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
              {adCampaigns.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{c.name}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{c.client}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{c.placement}</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--accent-ocean)]">{c.budget.toLocaleString('ru-RU')} ₽</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.spent.toLocaleString('ru-RU')} ₽</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.impressions.toLocaleString('ru-RU')}</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.clicks.toLocaleString('ru-RU')}</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--accent-ocean)]">{c.ctr}%</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${statusBadge[c.status]}`}>{statusLabels[c.status]}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'placements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adPlacements.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="sakh-title text-sm">{p.name}</h3>
                <span className={`sakh-tag ${placementStatusBadge[p.status]}`}>
                  {p.status === 'active' ? 'Активно' : 'Неактивно'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                  <MapPin size={12} />
                  <span>Зона: {p.zone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                  <Layout size={12} />
                  <span>{p.dimensions}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-ocean)]">
                  <DollarSign size={12} />
                  <span>{p.pricePerDay.toLocaleString('ru-RU')} ₽/день</span>
                </div>
              </div>
            </motion.div>
          ))}
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
              {clients.map((c, i) => (
                <motion.tr
                  key={c.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{c.name}</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.campaigns}</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--accent-ocean)]">{c.totalBudget.toLocaleString('ru-RU')} ₽</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.totalSpent.toLocaleString('ru-RU')} ₽</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: 'Показы', value: totalStats.impressions.toLocaleString('ru-RU'), suffix: '' },
            { icon: MousePointerClick, label: 'Клики', value: totalStats.clicks.toLocaleString('ru-RU'), suffix: '' },
            { icon: TrendingUp, label: 'CTR', value: totalStats.ctr.toString(), suffix: '%' },
            { icon: DollarSign, label: 'Доход', value: totalStats.spent.toLocaleString('ru-RU'), suffix: ' ₽' },
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
