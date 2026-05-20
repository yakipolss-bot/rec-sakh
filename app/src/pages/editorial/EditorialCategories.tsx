import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Save, X, Plus, Tag, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { categoriesService } from '@/services/categories.service';
import type { Category } from '@/services/categories.service';

export default function EditorialCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Category>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setLoading(true);
    categoriesService.getCategories()
      .then(setCategories)
      .catch(() => {
        setCategories([]);
        toast.error('Ошибка загрузки рубрик');
      })
      .finally(() => setLoading(false));
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditValues({ name: cat.name, slug: cat.slug, description: cat.description });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id: string) => {
    if (!editValues.name || !editValues.slug) {
      toast.error('Название и slug обязательны');
      return;
    }
    setSaving(true);
    try {
      await categoriesService.updateCategory(id, editValues);
      toast.success('Рубрика обновлена');
      cancelEdit();
      loadCategories();
    } catch {
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newCat.name || !newCat.slug) {
      toast.error('Название и slug обязательны');
      return;
    }
    setSaving(true);
    try {
      await categoriesService.createCategory(newCat);
      toast.success('Рубрика создана');
      setShowAdd(false);
      setNewCat({ name: '', slug: '', description: '' });
      loadCategories();
    } catch {
      toast.error('Ошибка при создании');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Удалить рубрику "${cat.name}"?`)) return;
    try {
      await categoriesService.deleteCategory(cat.id);
      loadCategories();
      toast.success(`Рубрика "${cat.name}" удалена`);
    } catch {
      toast.error('Нельзя удалить рубрику — возможно, к ней привязаны новости');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Рубрики</h1>
          <p className="sakh-meta mt-1">Управление рубриками портала</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="sakh-btn sakh-btn--primary sakh-btn--md">
          <Plus size={14} />
          Добавить рубрику
        </button>
      </div>

      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sakh-card p-4 mb-6"
        >
          <h3 className="sakh-caption text-[var(--text-secondary)] mb-3">Новая рубрика</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="sakh-caption block mb-1">Название</label>
              <input
                type="text"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="Название"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Slug</label>
              <input
                type="text"
                value={newCat.slug}
                onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                placeholder="slug-rubriki"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Описание</label>
              <input
                type="text"
                value={newCat.description}
                onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                placeholder="Описание рубрики"
                className="sakh-input"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="sakh-btn sakh-btn--primary sakh-btn--sm">
              <Save size={12} /> Сохранить
            </button>
            <button onClick={() => setShowAdd(false)} className="sakh-btn sakh-btn--ghost sakh-btn--sm">
              <X size={12} /> Отмена
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <p className="sakh-meta text-center py-8">Загрузка...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="px-3 py-2 text-left sakh-caption">Название</th>
                <th className="px-3 py-2 text-left sakh-caption">Slug</th>
                <th className="px-3 py-2 text-left sakh-caption">Описание</th>
                <th className="px-3 py-2 text-left sakh-caption">Новостей</th>
                <th className="px-3 py-2 sakh-caption">Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <p className="sakh-meta">Рубрики не найдены</p>
                  </td>
                </tr>
              )}
              {categories.map((cat, i) => (
                <motion.tr
                  key={cat.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  {editingId === cat.id ? (
                    <>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={editValues.name || ''}
                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                          className="sakh-input !text-xs !py-1"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={editValues.slug || ''}
                          onChange={(e) => setEditValues({ ...editValues, slug: e.target.value })}
                          className="sakh-input !text-xs !py-1"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          className="sakh-input !text-xs !py-1"
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-[var(--text-secondary)]">0</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => saveEdit(cat.id)}
                            disabled={saving}
                            className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-ocean)]"
                          >
                            <Save size={14} />
                          </button>
                          <button onClick={cancelEdit} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5">
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-[var(--text-primary)]">{cat.name}</td>
                      <td className="px-3 py-3 font-mono text-xs text-[var(--text-secondary)]">{cat.slug}</td>
                      <td className="px-3 py-3 sakh-meta">{cat.description}</td>
                      <td className="px-3 py-3 font-mono text-xs text-[var(--text-secondary)]">0</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(cat)} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5">
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
