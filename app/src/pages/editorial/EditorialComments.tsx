import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, XCircle, Shield, Ban, Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { Comment } from '@/models/admin/Comment';

type Tab = 'all' | 'pending' | 'reported' | 'banned' | 'blacklist';

const tabs: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'На модерации' },
  { value: 'reported', label: 'С жалобами' },
  { value: 'banned', label: 'Забаненные' },
  { value: 'blacklist', label: 'Чёрный список' },
];

const statusLabels: Record<string, string> = {
  approved: 'Одобрен',
  pending: 'На проверке',
  rejected: 'Отклонён',
  blocked: 'Заблокирован',
};

const statusBadge: Record<string, string> = {
  approved: 'sakh-tag--accent',
  pending: 'sakh-tag--sunset',
  rejected: 'sakh-tag--muted',
  blocked: 'sakh-tag--muted',
};

export default function EditorialComments() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [blacklist, setBlacklist] = useState<{ word: string }[]>([]);
  const [newWord, setNewWord] = useState('');

  useEffect(() => {
    Promise.all([
      adminService.getComments({ perPage: 200 }),
      adminService.getCommentBlacklist().catch(() => []),
    ])
      .then(([commentsData, bl]) => {
        setAllComments(commentsData.data);
        setBlacklist(bl);
      })
      .catch(() => toast.error('Ошибка загрузки комментариев'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...allComments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.text?.toLowerCase().includes(q) || c.author?.name?.toLowerCase().includes(q));
    }
    switch (activeTab) {
      case 'pending': result = result.filter((c) => c.status === 'pending'); break;
      case 'banned': result = result.filter((c) => c.status === 'rejected' || c.status === 'blocked'); break;
      default: break;
    }
    return result;
  }, [allComments, activeTab, search]);

  const handleModerate = async (comment: Comment, status: 'approved' | 'rejected') => {
    try {
      await adminService.moderateComment(comment.id, status);
      setAllComments((prev) => prev.map((c) => c.id === comment.id ? { ...c, status } : c));
      toast.success(status === 'approved' ? 'Комментарий одобрен' : 'Комментарий отклонён');
    } catch {
      toast.error('Ошибка при модерации');
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!confirm('Удалить комментарий?')) return;
    try {
      await adminService.deleteComment(comment.id);
      setAllComments((prev) => prev.filter((c) => c.id !== comment.id));
      toast.success('Комментарий удалён');
    } catch {
      toast.error('Ошибка при удалении');
    }
  };

  const handleBanUser = async (comment: Comment) => {
    if (!confirm(`Заблокировать пользователя "${comment.author?.name}" в комментариях?`)) return;
    try {
      await adminService.banCommentUser(comment.author!.id);
      toast.success(`Пользователь "${comment.author?.name}" заблокирован в комментариях`);
    } catch {
      toast.error('Ошибка при блокировке');
    }
  };

  const handleAddBlacklistWord = async () => {
    if (!newWord.trim()) return;
    try {
      await adminService.addCommentBlacklistWord(newWord.trim());
      setBlacklist((prev) => [...prev, { word: newWord.trim() }]);
      setNewWord('');
      toast.success('Слово добавлено в чёрный список');
    } catch {
      toast.error('Ошибка при добавлении слова');
    }
  };

  const handleRemoveBlacklistWord = async (word: string) => {
    try {
      await adminService.removeCommentBlacklistWord(word);
      setBlacklist((prev) => prev.filter((w) => w.word !== word));
      toast.success(`Слово "${word}" удалено из чёрного списка`);
    } catch {
      toast.error('Ошибка при удалении слова');
    }
  };

  return (
    <div>
      <h1 className="sakh-heading mb-2">Комментарии</h1>
      <p className="sakh-meta mb-6">Модерация комментариев пользователей</p>

      <div className="sakh-search mb-4 max-w-md">
        <Search className="sakh-search__icon" size={14} />
        <input
          type="text"
          placeholder="Поиск по тексту или автору..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sakh-search__input !h-9 !text-xs !pl-8"
        />
      </div>

      <div className="sakh-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`sakh-tabs__item ${activeTab === tab.value ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'blacklist' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="sakh-card p-4 mb-6 space-y-3"
        >
          <h3 className="sakh-caption text-[var(--text-primary)]">Чёрный список слов</h3>
          <div className="flex gap-2">
            <input
              type="text"
              className="sakh-input flex-1 !h-9 !text-xs"
              placeholder="Новое слово..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBlacklistWord()}
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

      {loading ? (
        <p className="sakh-meta text-center py-8">Загрузка...</p>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="sakh-empty">
              <MessageSquare size={48} className="sakh-empty__icon" />
              <h3 className="sakh-empty__title">Нет комментариев</h3>
              <p className="sakh-empty__description">В этом разделе пока нет комментариев</p>
            </div>
          ) : (
            filtered.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="sakh-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{comment.author?.name || '—'}</span>
                      <span className="sakh-meta">{comment.createdAt?.slice(0, 10) || ''}</span>
                      <span className={`sakh-tag ${statusBadge[comment.status] || ''}`}>
                        {statusLabels[comment.status] || comment.status}
                      </span>
                      {comment.articleTitle && (
                        <span className="sakh-meta text-[10px]">к статье: {comment.articleTitle}</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{comment.text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {comment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleModerate(comment, 'approved')}
                          className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-ocean)]"
                          title="Одобрить"
                        >
                          <CheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => handleModerate(comment, 'rejected')}
                          className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                          title="Отклонить"
                        >
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                    {comment.status === 'approved' && (
                      <button
                        onClick={() => handleModerate(comment, 'rejected')}
                        className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                        title="Забанить"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleBanUser(comment)}
                      className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5"
                      title="Заблокировать автора"
                    >
                      <Shield size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(comment)}
                      className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                      title="Удалить"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
