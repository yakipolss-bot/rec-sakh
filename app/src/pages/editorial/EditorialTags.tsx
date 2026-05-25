import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Tag, Merge, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import tagsService from '@/services/tags.service';
import type { Tag as TagType } from '@/models/tags/Tag';

export default function EditorialTags() {
  const queryClient = useQueryClient();
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['editorial', 'tags'],
    queryFn: () => tagsService.getTags().catch(() => [] as TagType[]),
  });
  const tags = Array.isArray(tagsData) ? tagsData : [];
  const [search, setSearch] = useState('');
  const [sourceTag, setSourceTag] = useState('');
  const [targetTag, setTargetTag] = useState('');

  const filtered = useMemo(
    () => tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [tags, search],
  );

  const handleMerge = async () => {
    if (!sourceTag || !targetTag || sourceTag === targetTag) return;
    const source = tags.find((t) => t.id === sourceTag);
    const target = tags.find((t) => t.id === targetTag);
    if (!source || !target) return;
    if (!confirm(`Объединить тег "${source.name}" с тегом "${target.name}"?`)) return;
    try {
      await tagsService.mergeTags(sourceTag, targetTag);
      toast.success(`Тег "${source.name}" объединён с "${target.name}"`);
      setSourceTag('');
      setTargetTag('');
      queryClient.invalidateQueries({ queryKey: ['editorial', 'tags'] });
    } catch {
      toast.error('Ошибка при объединении тегов');
    }
  };

  const handleDelete = async (tag: TagType) => {
    if (!confirm(`Удалить тег "${tag.name}"?`)) return;
    try {
      await tagsService.deleteTag(tag.id);
      queryClient.invalidateQueries({ queryKey: ['editorial', 'tags'] });
      toast.success(`Тег "${tag.name}" удалён`);
    } catch {
      toast.error('Ошибка при удалении тега');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Теги</h1>
          <p className="sakh-meta mt-1">Управление тегами и слияние дублей</p>
        </div>
      </div>

      {isLoading ? (
        <p className="sakh-meta text-center py-8">Загрузка...</p>
      ) : (
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
                    <th className="px-3 py-2 text-left sakh-caption">Slug</th>
                    <th className="px-3 py-2 text-left sakh-caption">Материалов</th>
                    <th className="px-3 py-2 sakh-caption">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tag, i) => (
                    <motion.tr
                      key={tag.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
                    >
                      <td className="px-3 py-2">
                        <span className="sakh-tag sakh-tag--accent">{tag.name}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{tag.slug}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{tag.count ?? 0}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDelete(tag)}
                          className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
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
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.count ?? 0})</option>
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
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.count ?? 0})</option>
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
      )}
    </div>
  );
}
