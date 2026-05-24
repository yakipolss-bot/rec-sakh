import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Edit, Eye, History, BarChart3,
  Trash2, AlertTriangle, Loader2,
} from 'lucide-react';
import newsService from '@/services/news.service';
import categoriesService from '@/services/categories.service';
import type { Article as NewsArticle } from '@/models/news/Article';
import type { Category } from '@/models/categories/Category';

const statusColors: Record<string, string> = {
  draft: 'sakh-tag--sunset',
  scheduled: 'sakh-tag--accent',
  published: 'sakh-tag--accent',
  archived: 'sakh-tag--muted',
  review: 'sakh-tag--sunset',
};

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирована',
  published: 'Опубликована',
  archived: 'Архив',
  review: 'На проверке',
};

const statusList = [
  { value: 'draft', label: 'Черновик' },
  { value: 'review', label: 'На проверке' },
  { value: 'scheduled', label: 'Запланирована' },
  { value: 'published', label: 'Опубликована' },
  { value: 'archived', label: 'Архив' },
];

export default function EditorialNewsList() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [newsRes, cats] = await Promise.all([
          newsService.getNews({ perPage: 100, sortBy: 'publishedAt', sortOrder: 'desc' }),
          categoriesService.getCategories(),
        ]);
        if (mounted) {
          setArticles(newsRes.data || []);
          setCategories(cats || []);
        }
      } catch {
        /* noop */
      }
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const authors = useMemo(() =>
    [...new Set(articles.map((a) => a.author?.name).filter(Boolean))] as string[],
    [articles]
  );

  const filtered = useMemo(() => {
    let result = [...articles];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      result = result.filter((n) => n.status === statusFilter);
    }
    if (authorFilter !== 'all') {
      result = result.filter((n) => n.author?.name === authorFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter((n) => n.categoryId === categoryFilter);
    }
    result.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
    return result;
  }, [articles, search, statusFilter, authorFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="sakh-search w-60">
            <Search className="sakh-search__icon" size={14} />
            <input
              type="text"
              placeholder="Поиск по заголовку..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sakh-search__input !h-9 !text-xs !pl-8"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="sakh-select !w-auto !text-xs !py-1.5 !h-9"
          >
            <option value="all">Все статусы</option>
            {statusList.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="sakh-select !w-auto !text-xs !py-1.5 !h-9"
          >
            <option value="all">Все авторы</option>
            {authors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sakh-select !w-auto !text-xs !py-1.5 !h-9"
          >
            <option value="all">Все рубрики</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Link to="/editorial/news/create" className="sakh-btn sakh-btn--primary sakh-btn--sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Создать
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              {[
                { key: 'title', label: 'Заголовок' },
                { key: 'authorName', label: 'Автор' },
                { key: 'categoryName', label: 'Рубрика' },
                { key: 'status', label: 'Статус' },
                { key: 'publishedAt', label: 'Дата' },
                { key: 'views', label: 'Просмотры' },
                { key: 'actions', label: '', sortable: false },
              ].map((col) => (
                <th key={col.key} className="px-3 py-2 text-left sakh-caption">
                  <div className="flex items-center gap-1">{col.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((news, i) => {
              const cat = categories.find(c => c.id === news.categoryId);
              return (
                <motion.tr
                  key={news.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {news.isUrgent && <AlertTriangle size={12} className="text-[var(--accent-sunset)] shrink-0" />}
                      <span className="text-[var(--text-primary)] line-clamp-1">{news.title}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 sakh-meta">{news.author?.name || '—'}</td>
                  <td className="px-3 py-3 sakh-meta">{cat?.name || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`sakh-tag ${statusColors[news.status] || 'sakh-tag--muted'}`}>
                      {statusLabels[news.status] || news.status || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 sakh-meta">
                    {news.publishedAt ? new Date(news.publishedAt).toLocaleDateString('ru-RU') : new Date(news.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-[var(--text-secondary)]">
                    {(news.viewsCount || 0).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/editorial/news/${news.id}/edit`} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-2"><Edit size={14} /></Link>
                      <Link to={`/editorial/news/${news.id}/preview`} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-2"><Eye size={14} /></Link>
                      <Link to={`/editorial/news/${news.id}/history`} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-2"><History size={14} /></Link>
                      <Link to={`/editorial/news/${news.id}/stats`} className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-2"><BarChart3 size={14} /></Link>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-2 text-[var(--accent-sunset)]"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="sakh-empty">
            <Search size={48} className="sakh-empty__icon" />
            <h3 className="sakh-empty__title">Новостей не найдено</h3>
            <p className="sakh-empty__description">Попробуйте изменить параметры фильтрации</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="sakh-meta">Найдено: {filtered.length}</p>
      </div>
    </div>
  );
}
