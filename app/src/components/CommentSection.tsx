import { useState, useMemo } from 'react';
import { MessageSquare, Clock, TrendingUp, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommentComponent from '@/components/Comment';
import type { Comment } from '@/types';

interface CommentSectionProps {
  newsId: string;
  comments: Comment[];
}

type SortMode = 'new' | 'best' | 'old';

const PAGE_SIZE = 20;

const commentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] },
  }),
};

interface SortOption {
  value: SortMode;
  label: string;
  icon: typeof Clock;
}

const sortOptions: SortOption[] = [
  { value: 'new', label: 'Новые сначала', icon: Clock },
  { value: 'best', label: 'Лучшие', icon: TrendingUp },
  { value: 'old', label: 'Старые сначала', icon: ArrowUpDown },
];

export default function CommentSection({ newsId, comments }: CommentSectionProps) {
  const [sortMode, setSortMode] = useState<SortMode>('new');
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const pinnedComments = useMemo(
    () => localComments.filter(c => c.parentId === null && c.isPinned),
    [localComments],
  );

  const sortedRootComments = useMemo(() => {
    const rootComments = localComments.filter(
      c => c.parentId === null && !c.isPinned,
    );
    switch (sortMode) {
      case 'new':
        return [...rootComments].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case 'old':
        return [...rootComments].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      case 'best':
        return [...rootComments].sort(
          (a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes),
        );
      default:
        return rootComments;
    }
  }, [localComments, sortMode]);

  const visibleComments = sortedRootComments.slice(0, visibleCount);
  const hasMore = visibleComments.length < sortedRootComments.length;

  const totalRootCount = localComments.filter(c => c.parentId === null).length;

  const handleNewComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const now = new Date().toISOString();
    const newCommentObj: Comment = {
      id: `new-${Date.now()}`,
      newsId,
      userId: 'u-current',
      author: { name: 'Вы', avatar: '', karma: 0 },
      userLevel: 'новичок',
      parentId: null,
      content: newComment,
      createdAt: now,
      likes: 0,
      dislikes: 0,
      isEdited: false,
      status: 'approved',
    };
    setLocalComments(prev => [newCommentObj, ...prev]);
    setNewComment('');
  };

  return (
    <section aria-label="Комментарии" className="border-t border-[var(--border-color)] pt-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="sakh-heading flex items-center gap-2 text-xl">
          <MessageSquare size={20} className="text-[var(--accent-ocean)]" />
          Комментарии
          <span className="text-sm font-mono text-[var(--text-muted)]">
            ({totalRootCount})
          </span>
        </h2>

        <div className="flex items-center gap-1">
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortMode(opt.value)}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-mono transition-colors rounded-none ${
                sortMode === opt.value
                  ? 'bg-[var(--ocean-alpha-20)] text-[var(--accent-ocean)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              aria-label={`Сортировать: ${opt.label}`}
            >
              <opt.icon size={12} />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleNewComment} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Написать комментарий..."
          className="sakh-input flex-1"
          aria-label="Текст комментария"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="sakh-btn sakh-btn--primary sakh-btn--md whitespace-nowrap"
        >
          Отправить
        </button>
      </form>

      {totalRootCount > 0 || pinnedComments.length > 0 ? (
        <div>
          <AnimatePresence>
            {pinnedComments.map((comment, i) => (
              <motion.div
                key={comment.id}
                custom={i}
                variants={commentVariants}
                initial="hidden"
                animate="visible"
              >
                <CommentComponent
                  comment={comment}
                  newsId={newsId}
                />
              </motion.div>
            ))}
            {visibleComments.map((comment, i) => (
              <motion.div
                key={comment.id}
                custom={pinnedComments.length + i}
                variants={commentVariants}
                initial="hidden"
                animate="visible"
              >
                <CommentComponent
                  comment={comment}
                  newsId={newsId}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="sakh-btn sakh-btn--secondary sakh-btn--md"
              >
                Показать ещё
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="sakh-empty">
          <MessageSquare size={48} className="sakh-empty__icon" />
          <h3 className="sakh-empty__title">Пока нет комментариев</h3>
          <p className="sakh-empty__description">
            Будьте первым, кто поделится своим мнением!
          </p>
        </div>
      )}
    </section>
  );
}
