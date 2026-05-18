import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Tag, Merge, ArrowRight } from 'lucide-react';
import { newsArticles } from '@/data/mock';

export default function EditorialTags() {
  const [search, setSearch] = useState('');
  const [sourceTag, setSourceTag] = useState('');
  const [targetTag, setTargetTag] = useState('');

  const tagStats = useMemo(() => {
    const map = new Map<string, number>();
    newsArticles.forEach((n) => n.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const filtered = useMemo(
    () => tagStats.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [tagStats, search],
  );

  const handleMerge = () => {
    if (sourceTag && targetTag && sourceTag !== targetTag) {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Теги</h1>
          <p className="sakh-meta mt-1">Управление тегами и слияние дублей</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="sakh-search mb-4">
            <Search className="sakh-search__icon" size={14} />
            <input
              type="text"
              placeholder="Поиск тегов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sakh-search__input !h-9 !text-xs !pl-8"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-3 py-2 text-left sakh-caption">Тег</th>
                  <th className="px-3 py-2 text-left sakh-caption">Материалов</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tag, i) => (
                  <motion.tr
                    key={tag.name}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    <td className="px-3 py-2">
                      <span className="sakh-tag sakh-tag--accent">{tag.name}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{tag.count}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="sakh-empty">
                <Tag size={48} className="sakh-empty__icon" />
                <h3 className="sakh-empty__title">Теги не найдены</h3>
              </div>
            )}
          </div>
        </div>

        <div className="sakh-card p-4 h-fit">
          <h3 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2 mb-4">
            <Merge size={14} />
            Слияние дублей
          </h3>
          <div className="space-y-3">
            <div>
              <label className="sakh-caption block mb-1">Исходный тег</label>
              <select
                value={sourceTag}
                onChange={(e) => setSourceTag(e.target.value)}
                className="sakh-select"
              >
                <option value="">Выберите тег</option>
                {tagStats.map((t) => (
                  <option key={t.name} value={t.name}>{t.name} ({t.count})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-center">
              <ArrowRight size={16} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Целевой тег</label>
              <select
                value={targetTag}
                onChange={(e) => setTargetTag(e.target.value)}
                className="sakh-select"
              >
                <option value="">Выберите тег</option>
                {tagStats.map((t) => (
                  <option key={t.name} value={t.name}>{t.name} ({t.count})</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleMerge}
              disabled={!sourceTag || !targetTag || sourceTag === targetTag}
              className="sakh-btn sakh-btn--secondary sakh-btn--md w-full"
            >
              <Merge size={14} />
              Объединить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
