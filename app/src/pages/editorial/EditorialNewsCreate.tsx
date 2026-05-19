import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save, Send, Video, Globe, ChevronDown, Upload, X,
  Loader2,
} from 'lucide-react';
import { newsService } from '@/services/news.service';
import { categoriesService } from '@/services/categories.service';
import type { Category } from '@/services/categories.service';

export default function EditorialNewsCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [lead, setLead] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [publishNow, setPublishNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  const [showSeo, setShowSeo] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    categoriesService.getCategories().then((cats) => {
      setCategories(cats || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  const handleSubmit = async (status: 'draft' | 'published' | 'scheduled') => {
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
        tags: tags.length > 0 ? tags : undefined,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDesc.trim() || undefined,
      };

      if (status === 'scheduled' && scheduledDate) {
        dto.scheduledAt = new Date(scheduledDate).toISOString();
      }

      const article = await newsService.createNews(dto);

      if (status === 'published') {
        await newsService.updateStatus(article.id, 'published');
      } else if (status === 'scheduled') {
        await newsService.updateStatus(article.id, 'review');
      }

      navigate('/editorial/news');
    } catch (err) {
      setError('Ошибка при сохранении. Проверьте заполнение полей.');
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

  return (
    <div className="max-w-4xl">
      <div className="space-y-6">
        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите заголовок новости..."
            className="sakh-input !text-lg !font-semibold"
          />
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Лид (краткое описание)</label>
          <textarea
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            placeholder="Краткое описание новости..."
            className="sakh-textarea"
            rows={3}
          />
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Текст новости</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Введите текст новости..."
            className="sakh-textarea min-h-[300px] font-body"
            rows={12}
          />
          <p className="sakh-meta mt-1">WYSIWYG-редактор будет доступен позже</p>
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Главное фото</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            className={`border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]' : 'border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
            }`}
          >
            <Upload size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="sakh-body text-sm">Перетащите фото сюда или кликните для выбора</p>
            <p className="sakh-meta mt-1">JPEG, PNG, WebP · Max 10 MB</p>
            <input type="file" accept="image/*" className="hidden" />
          </div>
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Видео</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Ссылка на видео (YouTube, VK Video...)"
              className="sakh-input flex-1"
            />
            <button className="sakh-btn sakh-btn--secondary sakh-btn--md">
              <Video size={14} />
              Добавить
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Рубрика</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="sakh-select"
            >
              <option value="">Выберите рубрику</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Город</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="sakh-select"
            >
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
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Добавить тег..."
                className="sakh-input flex-1"
              />
              <button onClick={addTag} className="sakh-btn sakh-btn--secondary sakh-btn--md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="sakh-tag sakh-tag--accent">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border border-[var(--border-color)]">
          <button
            onClick={() => setShowSeo(!showSeo)}
            className="flex items-center justify-between w-full p-3 text-left sakh-caption text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Globe size={14} />
              SEO-настройки
            </span>
            <ChevronDown size={14} className={`transition-transform ${showSeo ? 'rotate-180' : ''}`} />
          </button>
          {showSeo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="p-3 border-t border-[var(--border-color)] space-y-3"
            >
              <div>
                <label className="sakh-caption block mb-1">SEO-заголовок</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Заголовок для поисковых систем"
                  className="sakh-input"
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Meta-описание</label>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  placeholder="Краткое описание для поисковой выдачи"
                  className="sakh-textarea"
                  rows={2}
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Slug (URL)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="/news/your-slug"
                  className="sakh-input"
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">OG-изображение</label>
                <input type="file" accept="image/*" className="sakh-input" />
              </div>
            </motion.div>
          )}
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Публикация</label>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={publishNow}
                onChange={() => setPublishNow(true)}
                className="sakh-radio"
              />
              <span className="text-sm text-[var(--text-primary)]">Сейчас</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!publishNow}
                onChange={() => setPublishNow(false)}
                className="sakh-radio"
              />
              <span className="text-sm text-[var(--text-primary)]">Отложить</span>
            </label>
            {!publishNow && (
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="sakh-input !w-auto"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={() => handleSubmit(publishNow ? 'published' : 'scheduled')}
            disabled={submitting}
            className="sakh-btn sakh-btn--primary sakh-btn--md"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {publishNow ? 'Опубликовать' : 'Запланировать'}
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={submitting}
            className="sakh-btn sakh-btn--secondary sakh-btn--md"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Сохранить черновик
          </button>
          <Link to="/editorial/news" className="sakh-btn sakh-btn--ghost sakh-btn--md" tabIndex={submitting ? -1 : 0}>
            Отмена
          </Link>
        </div>
      </div>
    </div>
  );
}
