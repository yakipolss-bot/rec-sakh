import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, XCircle, Shield, Ban, Flag, Search } from 'lucide-react';
import { comments } from '@/data/mock';
import type { Comment } from '@/types';

type Tab = 'all' | 'pending' | 'reported' | 'banned' | 'blacklist';

const tabs: { value: Tab; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'На модерации' },
  { value: 'reported', label: 'С жалобами' },
  { value: 'banned', label: 'Забаненные' },
  { value: 'blacklist', label: 'Чёрный список' },
];

const flattenComments = (items: Comment[]): Comment[] => {
  const result: Comment[] = [];
  for (const c of items) {
    result.push(c);
    if (c.replies) result.push(...flattenComments(c.replies));
  }
  return result;
};

export default function EditorialComments() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [flatAll] = useState(() => flattenComments(comments));
  const [localComments, setLocalComments] = useState<Comment[]>(flatAll);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = [...localComments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.content.toLowerCase().includes(q) || c.author.name.toLowerCase().includes(q));
    }
    switch (activeTab) {
      case 'pending': result = result.filter((c) => c.status === 'pending'); break;
      case 'banned': result = result.filter((c) => c.status === 'rejected'); break;
      default: break;
    }
    return result;
  }, [localComments, activeTab, search]);

  const updateStatus = (commentId: string, status: Comment['status']) => {
    setLocalComments((prev) => prev.map((c) => c.id === commentId ? { ...c, status } : c));
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
              className={`sakh-card p-4 ${comment.parentId ? 'ml-8' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{comment.author.name}</span>
                    <span className="sakh-meta">{new Date(comment.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span className={`sakh-tag ${
                      comment.status === 'approved' ? 'sakh-tag--accent' :
                      comment.status === 'pending' ? 'sakh-tag--sunset' : 'sakh-tag--muted'
                    }`}>
                      {comment.status === 'approved' ? 'Одобрен' :
                       comment.status === 'pending' ? 'На проверке' : 'Отклонён'}
                    </span>
                    <span className="sakh-meta">Рейтинг: {comment.likes - comment.dislikes}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{comment.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {comment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(comment.id, 'approved')}
                        className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-ocean)]"
                        title="Одобрить"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => updateStatus(comment.id, 'rejected')}
                        className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                        title="Отклонить"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  {comment.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(comment.id, 'rejected')}
                      className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]"
                      title="Забанить"
                    >
                      <Ban size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
