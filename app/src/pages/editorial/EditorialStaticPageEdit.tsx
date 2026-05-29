import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Globe, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';

const staticPageMeta: Record<string, { title: string; slug: string }> = {
  about: { title: 'О проекте', slug: 'about' },
  contacts: { title: 'Контакты', slug: 'contacts' },
  privacy: { title: 'Политика конфиденциальности', slug: 'privacy' },
  terms: { title: 'Пользовательское соглашение', slug: 'terms' },
  advertising: { title: 'Реклама на сайте', slug: 'advertising' },
};

export default function EditorialStaticPageEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const meta = slug ? staticPageMeta[slug] : null;

  const { data, isLoading } = useQuery({
    queryKey: ['editorial', 'static-page', slug],
    queryFn: () => adminService.getSetting(`static_page:${slug}`).catch(() => null),
    enabled: !!slug,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (data) {
      const val = typeof data === 'object' && data !== null ? (data as Record<string, unknown>).value : data;
      if (val && typeof val === 'object') {
        setTitle((val as Record<string, string>).title || meta?.title || '');
        setContent((val as Record<string, string>).content || '');
      }
    } else if (meta) {
      setTitle(meta.title);
    }
  }, [data, meta]);

  const [showSeo, setShowSeo] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => adminService.updateSetting(`static_page:${slug}`, {
      title: title.trim(),
      content: content.trim(),
      slug,
    }),
    onSuccess: () => {
      toast.success('Страница сохранена');
      navigate('/admin/content');
    },
    onError: () => {
      toast.error('Ошибка при сохранении');
    },
  });

  if (!meta) {
    return (
      <div className="sakh-empty">
        <h3 className="sakh-empty__title">Страница не найдена</h3>
        <Link to="/admin/content" className="sakh-btn sakh-btn--primary sakh-btn--md mt-4">Вернуться к списку</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/content" className="sakh-meta sakh-meta--accent">&larr; К списку</Link>
        <span className="sakh-meta">Редактирование страницы</span>
      </div>

      <div className="space-y-6">
        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Заголовок</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="sakh-input !text-lg !font-semibold" />
        </div>

        <div>
          <label className="sakh-caption text-[var(--text-secondary)] block mb-1.5">Содержание</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="sakh-textarea"
            rows={16}
          />
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
                <input type="text" value={slug} className="sakh-input" readOnly />
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="sakh-btn sakh-btn--primary sakh-btn--md"
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Сохранить
          </button>
          <Link to="/admin/content" className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</Link>
        </div>
      </div>
    </div>
  );
}
