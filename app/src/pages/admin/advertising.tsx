import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Megaphone, TrendingUp, MousePointerClick,
  DollarSign, Eye, Layout, Plus, X, Save,
} from 'lucide-react';
import { toast } from 'sonner';

type AdTab = 'campaigns' | 'placements' | 'clients' | 'stats';

const tabs: { key: AdTab; label: string }[] = [
  { key: 'campaigns', label: 'Кампании' },
  { key: 'placements', label: 'Места' },
  { key: 'clients', label: 'Клиенты' },
  { key: 'stats', label: 'Статистика' },
];

interface Campaign {
  id: string;
  name: string;
  advertiser: string;
  placement: string;
  budget: number;
  spent: number;
  impressionsTarget: number;
  clicksTarget: number;
  isActive: boolean;
}

interface Placement {
  id: string;
  name: string;
  zone: string;
  width: number;
  height: number;
  pricePerDay: number;
  isActive: boolean;
}

const LS_KEY = 'sakh_advertising';

function loadData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveData(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function AdminAdvertising() {
  const { section } = useParams();
  const sectionToTab: Record<string, AdTab> = { campaigns: 'campaigns', placements: 'placements', clients: 'clients', stats: 'stats' };
  const [tab, setTab] = useState<AdTab>((section && sectionToTab[section]) || 'campaigns');

  useEffect(() => {
    if (section && sectionToTab[section]) setTab(sectionToTab[section]);
  }, [section]);

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadData(`${LS_KEY}_campaigns`, []));
  const [placements, setPlacements] = useState<Placement[]>(() => loadData(`${LS_KEY}_placements`, []));
  const [showForm, setShowForm] = useState<'campaign' | 'placement' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => { saveData(`${LS_KEY}_campaigns`, campaigns); }, [campaigns]);
  useEffect(() => { saveData(`${LS_KEY}_placements`, placements); }, [placements]);

  const resetForm = () => setForm({});

  const addCampaign = () => {
    const campaign: Campaign = {
      id: Date.now().toString(),
      name: form.name || 'Кампания',
      advertiser: form.advertiser || 'Клиент',
      placement: form.placement || '—',
      budget: Number(form.budget) || 0,
      spent: 0,
      impressionsTarget: Number(form.impressions) || 0,
      clicksTarget: Number(form.clicks) || 0,
      isActive: true,
    };
    setCampaigns(prev => [campaign, ...prev]);
    setShowForm(null);
    resetForm();
    toast.success('Кампания добавлена');
  };

  const addPlacement = () => {
    const placement: Placement = {
      id: Date.now().toString(),
      name: form.name || 'Место',
      zone: form.zone || 'header',
      width: Number(form.width) || 728,
      height: Number(form.height) || 90,
      pricePerDay: Number(form.price) || 0,
      isActive: true,
    };
    setPlacements(prev => [placement, ...prev]);
    setShowForm(null);
    resetForm();
    toast.success('Рекламное место добавлено');
  };

  const removeCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success('Кампания удалена');
  };

  const removePlacement = (id: string) => {
    setPlacements(prev => prev.filter(p => p.id !== id));
    toast.success('Место удалено');
  };

  const toggleCampaign = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const clientsMap = new Map<string, { name: string; campaigns: number; totalBudget: number; totalSpent: number }>();
  campaigns.forEach(c => {
    const key = c.advertiser;
    const existing = clientsMap.get(key);
    if (existing) {
      existing.campaigns++;
      existing.totalBudget += c.budget;
      existing.totalSpent += c.spent;
    } else {
      clientsMap.set(key, { name: key, campaigns: 1, totalBudget: c.budget, totalSpent: c.spent });
    }
  });
  const clients = Array.from(clientsMap.values());

  const totalStats = campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + c.impressionsTarget,
    clicks: acc.clicks + c.clicksTarget,
    spent: acc.spent + c.spent,
  }), { impressions: 0, clicks: 0, spent: 0 });
  const ctr = totalStats.impressions > 0 ? +((totalStats.clicks / totalStats.impressions) * 100).toFixed(2) : 0;

  const FRender = ({ fields, onSave, onCancel }: { fields: { key: string; label: string; type?: string }[]; onSave: () => void; onCancel: () => void }) => (
    <div className="sakh-card p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="sakh-caption block mb-1 text-xs">{f.label}</label>
            <input
              type={f.type || 'text'}
              value={form[f.key] || ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="sakh-input !py-1.5 !text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onSave} className="sakh-btn sakh-btn--primary sakh-btn--sm flex items-center gap-1">
          <Save size={14} /> Сохранить
        </button>
        <button onClick={onCancel} className="sakh-btn sakh-btn--ghost sakh-btn--sm">Отмена</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Реклама</h1>
      </div>

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
        <div>
          <button onClick={() => { setShowForm('campaign'); resetForm(); }} className="sakh-btn sakh-btn--primary sakh-btn--sm flex items-center gap-1 mb-4">
            <Plus size={14} /> Добавить кампанию
          </button>
          {showForm === 'campaign' && (
            <FRender
              fields={[
                { key: 'name', label: 'Название' },
                { key: 'advertiser', label: 'Рекламодатель' },
                { key: 'placement', label: 'Место размещения' },
                { key: 'budget', label: 'Бюджет', type: 'number' },
                { key: 'impressions', label: 'Цель по показам', type: 'number' },
                { key: 'clicks', label: 'Цель по кликам', type: 'number' },
              ]}
              onSave={addCampaign}
              onCancel={() => setShowForm(null)}
            />
          )}
          <div className="overflow-x-auto">
            <table className="sakh-table w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Название</th>
                  <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Клиент</th>
                  <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Бюджет</th>
                  <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Потрачено</th>
                  <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Показы</th>
                  <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Клики</th>
                  <th className="py-3 px-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8"><p className="sakh-meta">Нет рекламных кампаний</p></td></tr>
                )}
                {campaigns.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{c.name}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{c.advertiser}</td>
                    <td className="py-3 px-3 font-mono text-xs text-right text-[var(--accent-ocean)]">{c.budget.toLocaleString('ru-RU')} ₽</td>
                    <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.spent.toLocaleString('ru-RU')} ₽</td>
                    <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.impressionsTarget.toLocaleString('ru-RU')}</td>
                    <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.clicksTarget.toLocaleString('ru-RU')}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <span
                          className={`sakh-tag text-xs cursor-pointer ${c.isActive ? 'sakh-tag--accent' : 'sakh-tag--outline'}`}
                          onClick={() => toggleCampaign(c.id)}
                        >
                          {c.isActive ? 'Активна' : 'Пауза'}
                        </span>
                        <button onClick={() => removeCampaign(c.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--accent-sunset)]"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'placements' && (
        <div>
          <button onClick={() => { setShowForm('placement'); resetForm(); }} className="sakh-btn sakh-btn--primary sakh-btn--sm flex items-center gap-1 mb-4">
            <Plus size={14} /> Добавить место
          </button>
          {showForm === 'placement' && (
            <FRender
              fields={[
                { key: 'name', label: 'Название' },
                { key: 'zone', label: 'Зона' },
                { key: 'width', label: 'Ширина', type: 'number' },
                { key: 'height', label: 'Высота', type: 'number' },
                { key: 'price', label: 'Цена за день', type: 'number' },
              ]}
              onSave={addPlacement}
              onCancel={() => setShowForm(null)}
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {placements.length === 0 && (
              <p className="sakh-meta col-span-full text-center py-8">Нет рекламных мест</p>
            )}
            {placements.map(p => (
              <div key={p.id} className="sakh-card p-4 relative">
                <button onClick={() => removePlacement(p.id)} className="absolute top-2 right-2 p-1 text-[var(--text-muted)] hover:text-[var(--accent-sunset)]"><X size={14} /></button>
                <h3 className="sakh-title text-sm mb-3">{p.name}</h3>
                <div className="space-y-2 text-xs font-mono text-[var(--text-secondary)]">
                  <p>Зона: {p.zone}</p>
                  <p>Размер: {p.width}×{p.height}</p>
                  <p className="text-[var(--accent-ocean)]">{p.pricePerDay.toLocaleString('ru-RU')} ₽/день</p>
                </div>
              </div>
            ))}
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
              {clients.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8"><p className="sakh-meta">Нет клиентов</p></td></tr>
              )}
              {clients.map(c => (
                <tr key={c.name} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{c.name}</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.campaigns}</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--accent-ocean)]">{c.totalBudget.toLocaleString('ru-RU')} ₽</td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">{c.totalSpent.toLocaleString('ru-RU')} ₽</td>
                </tr>
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
            { icon: TrendingUp, label: 'CTR', value: ctr.toString(), suffix: '%' },
            { icon: DollarSign, label: 'Бюджет', value: totalStats.spent.toLocaleString('ru-RU'), suffix: ' ₽' },
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
