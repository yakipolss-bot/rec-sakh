import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderTree, Plus, Edit, Trash2, X, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { categoriesService } from '@/services/categories.service';
import type { Category } from '@/services/categories.service';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parentId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    setLoading(true);
    categoriesService.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', parentId: '' });
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', parentId: cat.parentId || '' });
    setEditId(cat.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast.error('Название и slug обязательны'); return; }
    setSaving(true);
    try {
      if (editId) {
        await categoriesService.updateCategory(editId, form);
        toast.success('Рубрика обновлена');
      } else {
        await categoriesService.createCategory(form);
        toast.success('Рубрика создана');
      }
      resetForm();
      loadCategories();
    } catch {
      toast.error('Ошибка при сохранении');
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

  const flattenCategories = (cats: Category[], depth = 0): { cat: Category; depth: number }[] => {
    const result: { cat: Category; depth: number }[] = [];
    for (const cat of cats) {
      result.push({ cat, depth });
      if (cat.children?.length) result.push(...flattenCategories(cat.children, depth + 1));
    }
    return result;
  };

  const flatList = flattenCategories(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Рубрики</h1>
        <button className="sakh-btn sakh-btn--primary sakh-btn--sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={14} /> Создать рубрику
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="sakh-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="sakh-caption text-[var(--text-primary)]">{editId ? 'Редактировать рубрику' : 'Новая рубрика'}</h3>
            <button onClick={resetForm} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="sakh-caption block mb-1">Название</label>
              <input type="text" className="sakh-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Slug</label>
              <input type="text" className="sakh-input" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="sakh-caption block mb-1">Описание</label>
              <textarea className="sakh-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Родительская рубрика</label>
              <select className="sakh-select w-full" value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))}>
                <option value="">Нет (корневая)</option>
                {flatList.map(({ cat }) => (
                  <option key={cat.id} value={cat.id} disabled={cat.id === editId!}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="sakh-btn sakh-btn--primary sakh-btn--sm" onClick={handleSave} disabled={saving}>
              <Check size={14} /> {editId ? 'Сохранить' : 'Создать'}
            </button>
            <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" onClick={resetForm}>Отмена</button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <p className="sakh-meta text-center py-8">Загрузка...</p>
      ) : categories.length === 0 ? (
        <div className="sakh-card p-8 text-center">
          <FolderTree size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="sakh-meta">Рубрики не найдены. Создайте первую рубрику.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Название</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Slug</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Тип</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дочерних</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {flatList.map(({ cat, depth }, i) => (
                <motion.tr
                  key={cat.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs text-[var(--text-primary)]" style={{ paddingLeft: depth * 16 }}>
                      {depth > 0 && <span className="text-[var(--text-muted)] mr-1">└</span>}
                      {cat.name}
                    </span>
                  </td>
                  <td className="py-3 px-3"><code className="text-xs text-[var(--accent-ocean)] font-mono">{cat.slug}</code></td>
                  <td className="py-3 px-3"><span className="sakh-tag sakh-tag--outline">{cat.type || 'news'}</span></td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{cat.children?.length ?? 0}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Редактировать" onClick={() => openEdit(cat)}>
                        <Edit size={14} />
                      </button>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm text-[var(--accent-sunset)]" title="Удалить" onClick={() => handleDelete(cat)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
