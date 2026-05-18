import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Shield, MessageSquare } from 'lucide-react';
import { getNewsById, getCommentsByNewsId } from '@/data/mock';
import type { Comment } from '@/types';

export default function EditorialNewsComments() {
  const { id } = useParams<{ id: string }>();
  const article = getNewsById(id || '');
  const allComments = getCommentsByNewsId(id || '');
  const [comments, setComments] = useState<Comment[]>(allComments);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const filtered = filter === 'all' ? comments : comments.filter((c) => c.status === filter);

  const flattenComments = (items: Comment[]): Comment[] => {
    const result: Comment[] = [];
    for (const c of items) {
      result.push(c);
      if (c.replies) result.push(...flattenComments(c.replies));
    }
    return result;
  };

  const flatFiltered = flattenComments(filtered);

  const updateStatus = (commentId: string, status: Comment['status']) => {
    const update = (items: Comment[]): Comment[] =>
      items.map((c) => {
        if (c.id === commentId) return { ...c, status };
        if (c.replies) return { ...c, replies: update(c.replies) };
        return c;
      });
    setComments(update(comments));
  };

  if (!article) {
    return (
      <div className="sakh-empty">
        <h3 className="sakh-empty__title">Новость не найдена</h3>
        <Link to="/editorial/news" className="sakh-btn sakh-btn--primary sakh-btn--md mt-4">К списку</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/editorial/news" className="sakh-meta sakh-meta--accent">
          <ArrowLeft size={14} className="inline mr-1" />К списку
        </Link>
        <span className="sakh-meta">Комментарии: {article.title}</span>
      </div>

      <div className="sakh-tabs mb-6">
        {(['all', 'pending', 'approved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`sakh-tabs__item ${filter === tab ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab === 'all' ? 'Все' : tab === 'pending' ? 'На модерации' : 'Одобренные'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {flatFiltered.length === 0 ? (
          <div className="sakh-empty">
            <MessageSquare size={48} className="sakh-empty__icon" />
            <h3 className="sakh-empty__title">Комментариев нет</h3>
          </div>
        ) : (
          flatFiltered.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`sakh-card p-4 ${comment.parentId ? 'ml-8' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{comment.author.name}</span>
                    <span className="sakh-meta">{new Date(comment.createdAt).toLocaleDateString('ru-RU')}</span>
                    <span className={`sakh-tag ${
                      comment.status === 'approved' ? 'sakh-tag--accent' :
                      comment.status === 'pending' ? 'sakh-tag--sunset' : 'sakh-tag--muted'
                    }`}>
                      {comment.status === 'approved' ? 'Одобрен' :
                       comment.status === 'pending' ? 'На проверке' : 'Отклонён'}
                    </span>
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
                    <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !px-1.5 text-[var(--accent-sunset)]" title="Забанить">
                      <Shield size={14} />
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
