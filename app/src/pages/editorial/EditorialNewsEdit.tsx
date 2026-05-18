import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save, Send, Image, Video, Globe, ChevronDown, Upload, X,
} from 'lucide-react';
import { categories, getNewsById } from '@/data/mock';

export default function EditorialNewsEdit() {
  const { id } = useParams<{ id: string }>();
  const article = getNewsById(id || '');

  const [title, setTitle] = useState(article?.title || '');
  const [lead, setLead] = useState(article?.lead || '');
  const [content, setContent] = useState(article?.content || '');
  const [category, setCategory] = useState(article?.category.id || '');
  const [city, setCity] = useState(article?.city || '');
  const [showSeo, setShowSeo] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [dragOver, setDragOver] = useState(false);

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
        <span className="sakh-meta">Редактирование: {article.title}</span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sakh-input !text-lg !font-semibold"
          />
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Лид</label>
          <textarea
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            className="sakh-textarea"
            rows={3}
          />
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Текст</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="sakh-textarea min-h-[300px]"
            rows={12}
          />
          <p className="sakh-meta mt-1">WYSIWYG-редактор будет доступен позже</p>
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Главное фото</label>
          {article.mainImageUrl && (
            <div className="mb-2 relative inline-block">
              <img src={article.mainImageUrl} alt="" className="h-32 object-cover" />
            </div>
          )}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            className={`border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]' : 'border-[var(--border-color)]'
            }`}
          >
            <Upload size={24} className="mx-auto mb-1 text-[var(--text-muted)]" />
            <p className="sakh-body text-sm">Заменить фото</p>
            <input type="file" accept="image/*" className="hidden" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Рубрика</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="sakh-select">
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
            <span className="flex items-center gap-2"><Globe size={14} />SEO-настройки</span>
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
                <input type="text" placeholder="SEO-заголовок" className="sakh-input" />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Meta-описание</label>
                <textarea className="sakh-textarea" rows={2} placeholder="Meta-описание" />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Slug</label>
                <input type="text" value={article.slug} className="sakh-input" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
          <button className="sakh-btn sakh-btn--primary sakh-btn--md">
            <Send size={14} />
            Сохранить
          </button>
          <button className="sakh-btn sakh-btn--secondary sakh-btn--md">
            <Save size={14} />
            Черновик
          </button>
          <Link to="/editorial/news" className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</Link>
        </div>
      </div>
    </div>
  );
}
