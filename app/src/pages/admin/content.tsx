import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, XCircle, AlertTriangle,
  ArrowUp, ArrowDown, Eye, Edit, Trash2, ToggleLeft,
  Layout, Image, Menu as MenuIcon, Grid,
} from 'lucide-react';

const tabs = ['Массовые операции', 'Статические страницы', 'Баннеры', 'Меню', 'Виджеты'];

const rubrics = [
  'Новости', 'Спорт', 'Экономика', 'Культура',
  'Экология', 'Политика', 'Образование', 'Происшествия',
];

const bulkActions = [
  'Опубликовать', 'Снять с публикации', 'Архивировать',
  'Удалить', 'Изменить рубрику',
];

const staticPages = [
  { id: 'p1', title: 'О проекте', url: '/about', status: 'published' as const },
  { id: 'p2', title: 'Контакты', url: '/contacts', status: 'published' as const },
  { id: 'p3', title: 'Политика конфиденциальности', url: '/privacy', status: 'published' as const },
  { id: 'p4', title: 'Пользовательское соглашение', url: '/terms', status: 'published' as const },
  { id: 'p5', title: 'Реклама на сайте', url: '/advertising', status: 'draft' as const },
];

const banners = [
  { id: 'b1', name: 'Главная — верх', zone: 'Хидер', dimensions: '728x90', status: 'active' as const },
  { id: 'b2', name: 'Сайдбар — правый', zone: 'Сайдбар', dimensions: '300x250', status: 'active' as const },
  { id: 'b3', name: 'Внутри новости', zone: 'Контент', dimensions: '468x60', status: 'active' as const },
  { id: 'b4', name: 'Футер — широкий', zone: 'Подвал', dimensions: '970x90', status: 'inactive' as const },
  { id: 'b5', name: 'Мобильный — низ', zone: 'Мобайл', dimensions: '320x100', status: 'active' as const },
];

const menuItems = [
  { id: 'm1', label: 'Главная', url: '/', order: 0 },
  { id: 'm2', label: 'Новости', url: '/news', order: 1 },
  { id: 'm3', label: 'Объявления', url: '/ads', order: 2 },
  { id: 'm4', label: 'Справочник', url: '/directory', order: 3 },
  { id: 'm5', label: 'Погода', url: '/weather', order: 4 },
  { id: 'm6', label: 'Контакты', url: '/contacts', order: 5 },
];

const widgets = [
  { id: 'w1', name: 'Погода', zone: 'Сайдбар', status: 'active' as const },
  { id: 'w2', name: 'Курсы валют', zone: 'Сайдбар', status: 'active' as const },
  { id: 'w3', name: 'Последние новости', zone: 'Сайдбар', status: 'active' as const },
  { id: 'w4', name: 'Опрос', zone: 'Контент', status: 'inactive' as const },
  { id: 'w5', name: 'Календарь', zone: 'Сайдбар', status: 'inactive' as const },
];

const statusLabels: Record<string, string> = {
  published: 'Опубликована',
  draft: 'Черновик',
  active: 'Активен',
  inactive: 'Неактивен',
};

const statusStyle: Record<string, string> = {
  published: 'sakh-tag--accent',
  draft: 'sakh-tag--outline',
  active: 'sakh-tag--accent',
  inactive: 'sakh-tag--outline',
};

export default function AdminContent() {
  const [tab, setTab] = useState(0);
  const [selectedRubric, setSelectedRubric] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [bannerList, setBannerList] = useState(banners);
  const [menuList, setMenuList] = useState(menuItems);
  const [widgetList] = useState(widgets);
  const [bulkLog, setBulkLog] = useState<string[]>([]);

  const toggleBanner = (id: string) => {
    setBannerList(prev =>
      prev.map(b => b.id === id ? { ...b, status: b.status === 'active' ? 'inactive' as const : 'active' as const } : b)
    );
  };

  const moveMenuItem = (id: string, dir: 'up' | 'down') => {
    setMenuList(prev => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx === -1) return prev;
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((m, i) => ({ ...m, order: i }));
    });
  };

  const handleBulkAction = () => {
    if (!selectedRubric || !selectedAction) return;
    setBulkLog(prev => [
      `${selectedAction}: рубрика «${selectedRubric}» — ${new Date().toLocaleTimeString()}`,
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Контент</h1>
        <FileText size={16} className="text-[var(--accent-ocean)]" />
      </div>

      <div className="sakh-tabs">
        {tabs.map((t, i) => (
          <button
            key={t}
            className={`sakh-tabs__item ${tab === i ? 'sakh-tabs__item--active' : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="sakh-card p-4">
            <h3 className="sakh-caption text-[var(--text-primary)] mb-4">Параметры операции</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                className="sakh-select !w-auto !h-9 !text-xs"
                value={selectedRubric}
                onChange={e => setSelectedRubric(e.target.value)}
              >
                <option value="">Выберите рубрику</option>
                {rubrics.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select
                className="sakh-select !w-auto !h-9 !text-xs"
                value={selectedAction}
                onChange={e => setSelectedAction(e.target.value)}
              >
                <option value="">Выберите действие</option>
                {bulkActions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <button
                className="sakh-btn sakh-btn--primary sakh-btn--sm"
                disabled={!selectedRubric || !selectedAction}
                onClick={handleBulkAction}
              >
                <CheckCircle size={14} />
                Применить
              </button>
            </div>
          </div>

          {bulkLog.length > 0 && (
            <div className="sakh-card p-4">
              <h3 className="sakh-caption text-[var(--text-primary)] mb-3">Журнал операций</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {bulkLog.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs font-mono text-[var(--text-secondary)] border-b border-[var(--border-subtle)] last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-ocean)] shrink-0" />
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {tab === 1 && (
        <motion.div key="pages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Название</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">URL</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {staticPages.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{p.title}</td>
                  <td className="py-3 px-3">
                    <code className="text-xs text-[var(--accent-ocean)] font-mono">{p.url}</code>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${statusStyle[p.status]}`}>{statusLabels[p.status]}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Редактировать">
                        <Edit size={14} />
                      </button>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Просмотр">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {tab === 2 && (
        <motion.div key="banners" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bannerList.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--text-primary)]">{b.name}</span>
                  <Image size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="bg-[var(--bg-surface)] h-20 flex items-center justify-center text-[var(--text-muted)] font-mono text-xs">
                  {b.dimensions}
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">{b.zone}</span>
                  <span className="text-[var(--text-secondary)]">{b.dimensions}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                  <span className={`sakh-tag ${statusStyle[b.status]}`}>{statusLabels[b.status]}</span>
                  <button
                    onClick={() => toggleBanner(b.id)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      b.status === 'active' ? 'bg-[var(--accent-ocean)]' : 'bg-[var(--bg-surface)]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      b.status === 'active' ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {tab === 3 && (
        <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {menuList.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="sakh-card sakh-card--horizontal items-center p-3 gap-3"
            >
              <div className="flex items-center gap-2 text-[var(--text-muted)] font-mono text-xs w-6">
                {item.order + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-[var(--text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.url}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                  disabled={i === 0}
                  onClick={() => moveMenuItem(item.id, 'up')}
                  title="Вверх"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                  disabled={i === menuList.length - 1}
                  onClick={() => moveMenuItem(item.id, 'down')}
                  title="Вниз"
                >
                  <ArrowDown size={14} />
                </button>
                <button className="sakh-btn sakh-btn--ghost sakh-btn--sm text-[var(--accent-sunset)]" title="Удалить">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {tab === 4 && (
        <motion.div key="widgets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgetList.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--text-primary)]">{w.name}</span>
                  <Grid size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Зона:</span>
                  <span className="text-[var(--text-secondary)]">{w.zone}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                  <span className={`sakh-tag ${statusStyle[w.status]}`}>{statusLabels[w.status]}</span>
                  <button
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      w.status === 'active' ? 'bg-[var(--accent-ocean)]' : 'bg-[var(--bg-surface)]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      w.status === 'active' ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
