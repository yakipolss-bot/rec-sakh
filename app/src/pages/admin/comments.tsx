import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Trash2, Ban, UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { Comment } from '@/services/admin.service';

const statusLabels: Record<string, string> = {
  approved: 'Одобрен',
  pending: 'На модерации',
  rejected: 'Отклонён',
  blocked: 'Заблокирован',
};

const statusBadge: Record<string, string> = {
  approved: 'sakh-tag--accent',
  pending: 'sakh-tag--outline',
  rejected: 'sakh-tag--sunset',
  blocked: 'sakh-tag--sunset',
};

const ITEMS_PER_PAGE = 10;

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все');
  const [page, setPage] = useState(1);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [blacklist, setBlacklist] = useState<{ word: string }[]>([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    Promise.all([
      adminService.getComments({ perPage: 100 }),
      adminService.getCommentBlacklist().catch(() => []),
    ])
      .then(([commentsData, bl]) => {
        setComments(commentsData.data);
        setBlacklist(bl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statuses = useMemo(() => ['Все', ...new Set(comments.map(c => c.status))], [comments]);

  const filtered = useMemo(() => {
    return comments.filter(c => {
      if (search && !c.text.toLowerCase().includes(search.toLowerCase()) && !c.author?.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'Все' && c.status !== statusFilter) return false;
      return true;
    });
  }, [comments, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (comment: Comment) => {
    if (!confirm('Удалить комментарий?')) return;
    try {
      await adminService.deleteComment(comment.id);
      setComments(prev => prev.filter(c => c.id !== comment.id));
      toast.success('Комментарий удалён');
    } catch {
      toast.error('Ошибка при удалении');
    }
  };

  const handleModerate = async (comment: Comment, status: 'approved' | 'rejected') => {
    try {
      await adminService.moderateComment(comment.id, status);
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, status } : c));
      toast.success(status === 'approved' ? 'Комментарий одобрен' : 'Комментарий отклонён');
    } catch {
      toast.error('Ошибка при модерации');
    }
  };

  const handleBanUser = async (comment: Comment) => {
    if (!confirm(`Заблокировать пользователя "${comment.author.name}" в комментариях?`)) return;
    try {
      await adminService.banCommentUser(comment.author.id);
      toast.success(`Пользователь "${comment.author.name}" заблокирован в комментариях`);
    } catch {
      toast.error('Ошибка при блокировке');
    }
  };

  const handleAddBlacklistWord = async () => {
    if (!newWord.trim()) return;
    try {
      await adminService.addCommentBlacklistWord(newWord.trim());
      setBlacklist(prev => [...prev, { word: newWord.trim() }]);
      setNewWord('');
      toast.success('Слово добавлено в чёрный список');
    } catch {
      toast.error('Ошибка при добавлении слова');
    }
  };

  const handleRemoveBlacklistWord = async (word: string) => {
    try {
      await adminService.removeCommentBlacklistWord(word);
      setBlacklist(prev => prev.filter(w => w.word !== word));
      toast.success(`Слово "${word}" удалено из чёрного списка`);
    } catch {
      toast.error('Ошибка при удалении слова');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Комментарии</h1>
        <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" onClick={() => setShowBlacklist(!showBlacklist)}>
          <Ban size={14} /> Чёрный список
        </button>
      </div>

      {showBlacklist && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="sakh-card p-4 space-y-3">
          <h3 className="sakh-caption text-[var(--text-primary)]">Чёрный список слов</h3>
          <div className="flex gap-2">
            <input
              type="text"
              className="sakh-input flex-1 !h-9 !text-xs"
              placeholder="Новое слово..."
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddBlacklistWord()}
            />
            <button className="sakh-btn sakh-btn--primary sakh-btn--sm" onClick={handleAddBlacklistWord}>Добавить</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {blacklist.map((item) => (
              <span key={item.word} className="sakh-tag sakh-tag--sunset flex items-center gap-1">
                {item.word}
                <button onClick={() => handleRemoveBlacklistWord(item.word)} className="ml-1 hover:text-[var(--text-primary)]">
                  <XCircle size={12} />
                </button>
              </span>
            ))}
            {blacklist.length === 0 && <p className="sakh-meta text-xs">Список пуст</p>}
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="sakh-search flex-1 min-w-[200px]">
          <Search className="sakh-search__icon" size={14} />
          <input
            type="text"
            placeholder="Поиск по тексту или автору..."
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
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Текст</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Автор</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дата</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8"><p className="sakh-meta">Комментарии не найдены</p></td>
                </tr>
              )}
              {paged.map((comment, i) => (
                <motion.tr
                  key={comment.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 max-w-xs">
                    <p className="font-mono text-xs text-[var(--text-primary)] line-clamp-2">{comment.text}</p>
                    {comment.articleTitle && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">к статье: {comment.articleTitle}</p>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--accent-ocean)]">{comment.author?.name || '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${statusBadge[comment.status] || ''}`}>{statusLabels[comment.status] || comment.status}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{comment.createdAt?.slice(0, 10) || '—'}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {comment.status === 'pending' && (
                        <>
                          <button className="sakh-btn sakh-btn--secondary sakh-btn--sm" title="Одобрить" onClick={() => handleModerate(comment, 'approved')}>
                            <CheckCircle size={14} />
                          </button>
                          <button className="sakh-btn sakh-btn--danger sakh-btn--sm" title="Отклонить" onClick={() => handleModerate(comment, 'rejected')}>
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Заблокировать автора" onClick={() => handleBanUser(comment)}>
                        <UserX size={14} />
                      </button>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm text-[var(--accent-sunset)]" title="Удалить" onClick={() => handleDelete(comment)}>
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
            <button key={i + 1} className={`sakh-pagination__item ${page === i + 1 ? 'sakh-pagination__item--active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="sakh-pagination__item" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
