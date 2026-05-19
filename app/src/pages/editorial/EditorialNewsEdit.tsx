import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save, Send, Globe, ChevronDown, Upload, X,
  Loader2,
} from 'lucide-react';
import { newsService } from '@/services/news.service';
import { categoriesService } from '@/services/categories.service';
import type { Category } from '@/services/categories.service';
import type { NewsArticle } from '@/services/news.service';

export default function EditorialNewsEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [lead, setLead] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [showSeo, setShowSeo] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [art, cats] = await Promise.all([
          newsService.getNewsById(id || ''),
          categoriesService.getCategories(),
        ]);
        if (mounted) {
          setArticle(art);
          setTitle(art.title);
          setLead(art.lead || '');
          setContent(art.content);
          setCategory(art.categoryId || '');
          setCity(art.city || '');
          setTags((art.tags as string[]) || []);
          setCategories(cats || []);
        }
      } catch {}
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const addTag = () => {
    const trimmed = tagsInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagsInput('');
    }
  };

  const removeTag = (tag: string) => setTags.filter((t) => t !== tag);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const handleSave = async (status?: string) => {
    if (!title.trim()) { setError('Заголовок обязателен'); return; }
    if (!content.trim()) { setError('Текст новости обязателен'); return; }

    setSubmitting(true);
    setError('');

    try {
      const dto: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        lead: lead.trim() || undefined,
        categoryId: category || undefined,
        city: city || undefined,
      };

      await newsService.updateNews(id || '', dto);

      if (status) {
        await newsService.updateStatus(id || '', status);
      }

      navigate('/editorial/news');
    } catch {
      setError('Ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="sakh-empty">
        <h3 className="sakh-empty__title">Новость не найдена</h3>
        <Link to="/editorial/news" className="sakh-btn sakh-btn--primary sakh-btn--md mt-4">Вернуться к списку</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/editorial/news" className="sakh-meta sakh-meta--accent">&larr; К списку</Link>
        <span className="sakh-meta">Редактирование</span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Заголовок</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="sakh-input !text-lg !font-semibold" />
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Лид</label>
          <textarea value={lead} onChange={(e) => setLead(e.target.value)} className="sakh-textarea" rows={3} />
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Текст</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="sakh-textarea min-h-[300px]" rows={12} />
          <p className="sakh-meta mt-1">WYSIWYG-редактор будет доступен позже</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Рубрика</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="sakh-select">
              <option value="">Без рубрики</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Город</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="sakh-select">
              <option value="">Выберите город</option>
              <option value="yuzhno-sakhalinsk">Южно-Сахалинск</option>
              <option value="korsakov">Корсаков</option>
              <option value="kholmsk">Холмск</option>
              <option value="okha">Оха</option>
              <option value="nevelsk">Невельск</option>
            </select>
          </div>
          <div>
            <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Теги</label>
            <div className="flex gap-1">
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Добавить тег..." className="sakh-input flex-1" />
              <button onClick={addTag} className="sakh-btn sakh-btn--secondary sakh-btn--md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="sakh-tag sakh-tag--accent">
                    {tag}<button onClick={() => removeTag(tag)} className="ml-1"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border border-[var(--border-color)]">
          <button onClick={() => setShowSeo(!showSeo)}
            className="flex items-center justify-between w-full p-3 text-left sakh-caption text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <span className="flex items-center gap-2"><Globe size={14} />SEO-настройки</span>
            <ChevronDown size={14} className={`transition-transform ${showSeo ? 'rotate-180' : ''}`} />
          </button>
          {showSeo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="p-3 border-t border-[var(--border-color)] space-y-3">
              <div>
                <label className="sakh-caption block mb-1">Slug</label>
                <input type="text" value={article.slug} className="sakh-input" readOnly />
              </div>
            </motion.div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
          <button onClick={() => handleSave()} disabled={submitting} className="sakh-btn sakh-btn--primary sakh-btn--md">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Сохранить
          </button>
          {article.status === 'draft' && (
            <button onClick={() => handleSave('published')} disabled={submitting} className="sakh-btn sakh-btn--secondary sakh-btn--md">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Опубликовать
            </button>
          )}
          <Link to="/editorial/news" className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</Link>
        </div>
      </div>
    </div>
  );
}
