import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight, Plus,
  Eye, Edit, Trash2, CheckCircle, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import newsService from '@/services/news.service';
import type { Article as NewsArticle } from '@/models/news/Article';

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликована',
  archived: 'Архив',
  rejected: 'Отклонена',
  pending: 'На проверке',
};

const statusBadge: Record<string, string> = {
  draft: 'sakh-tag--outline',
  published: 'sakh-tag--accent',
  archived: 'sakh-tag--muted',
  rejected: 'sakh-tag--sunset',
  pending: 'sakh-tag--outline',
};

const ITEMS_PER_PAGE = 10;

export default function AdminNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все');
  const [page, setPage] = useState(1);

  useEffect(() => {
    newsService.getNews({ perPage: 50, sort: 'createdAt' })
      .then(({ data }) => setArticles(data))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const statuses = useMemo(() => ['Все', ...new Set(articles.map(a => a.status))], [articles]);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'Все' && a.status !== statusFilter) return false;
      return true;
    });
  }, [articles, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (article: NewsArticle) => {
    if (!confirm(`Удалить новость "${article.title}"?`)) return;
    try {
      await newsService.deleteNews(article.id);
      setArticles(prev => prev.filter(a => a.id !== article.id));
      toast.success('Новость удалена');
    } catch {
      toast.error('Ошибка при удалении');
    }
  };

  const handleStatus = async (article: NewsArticle, status: string) => {
    try {
      await newsService.updateStatus(article.id, status);
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status } : a));
      toast.success(`Статус изменён на «${statusLabels[status]}»`);
    } catch {
      toast.error('Ошибка при смене статуса');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Новости</h1>
        <a href="/editorial/news/create" className="sakh-btn sakh-btn--primary sakh-btn--sm">
          <Plus size={14} /> Создать
        </a>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="sakh-search flex-1 min-w-[200px]">
          <Search className="sakh-search__icon" size={14} />
          <input
            type="text"
            placeholder="Поиск по заголовку..."
            className="sakh-search__input !h-9 !text-xs !pl-8"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="sakh-select !w-auto !h-9 !text-xs"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'Все' ? 'Все статусы' : statusLabels[s] || s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="sakh-meta text-center py-8">Загрузка...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Заголовок</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Автор</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Просмотры</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Создана</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <p className="sakh-meta">Новости не найдены</p>
                  </td>
                </tr>
              )}
              {paged.map((article, i) => (
                <motion.tr
                  key={article.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {article.mainImageUrl && (
                        <img src={article.mainImageUrl} alt="" className="w-8 h-8 object-cover flex-shrink-0" />
                      )}
                      <span className="font-mono text-xs text-[var(--text-primary)] line-clamp-1">{article.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${statusBadge[article.status] || ''}`}>
                      {statusLabels[article.status] || article.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{article.author?.name || '—'}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{article.viewsCount ?? '—'}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{article.createdAt?.slice(0, 10) || '—'}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Просмотр" onClick={() => window.open(`/news/${article.id}`, '_blank')}>
                        <Eye size={14} />
                      </button>
                      <a href={`/editorial/news/${article.id}/edit`} className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Редактировать">
                        <Edit size={14} />
                      </a>
                      {article.status !== 'published' && (
                        <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Опубликовать" onClick={() => handleStatus(article, 'published')}>
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {article.status === 'published' && (
                        <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Архивировать" onClick={() => handleStatus(article, 'archived')}>
                          <XCircle size={14} />
                        </button>
                      )}
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm text-[var(--accent-sunset)]" title="Удалить" onClick={() => handleDelete(article)}>
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

      {totalPages > 1 && (
        <div className="sakh-pagination justify-center">
          <button className="sakh-pagination__item" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`sakh-pagination__item ${page === i + 1 ? 'sakh-pagination__item--active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="sakh-pagination__item" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
