import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronUp, ChevronDown, Reply, MoreHorizontal, AlertTriangle,
  Pin, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Comment as CommentType } from '@/types';

const LEVEL_STYLES: Record<CommentType['userLevel'], { label: string; className: string }> = {
  'новичок': { label: 'Новичок', className: 'text-[var(--text-muted)] bg-[var(--bg-surface)]' },
  'участник': { label: 'Участник', className: 'text-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]' },
  'постоянный': { label: 'Постоянный', className: 'text-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]' },
  'авторитет': { label: 'Авторитет', className: 'text-[var(--accent-sunset)] bg-[var(--sunset-alpha-10)]' },
  'лидер мнений': { label: 'Лидер мнений', className: 'text-[var(--accent-sunset)] bg-[var(--sunset-alpha-20)]' },
};

const REPORT_REASONS = ['Оскорбление', 'Спам', 'Оффтоп', 'Другое'];

const DEPTH_PADDING: Record<number, string> = {
  0: 'pl-0',
  1: 'pl-4',
  2: 'pl-8',
  3: 'pl-12',
};

const DEPTH_BORDER: Record<number, string> = {
  0: '',
  1: 'border-l border-[var(--accent-ocean-20)]',
  2: 'border-l border-[var(--accent-ocean-10)]',
  3: 'border-l border-[var(--border-color)]',
};

function getKarmaLevel(karma: number): CommentType['userLevel'] {
  if (karma >= 1000) return 'лидер мнений';
  if (karma >= 500) return 'авторитет';
  if (karma >= 200) return 'постоянный';
  if (karma >= 50) return 'участник';
  return 'новичок';
}

interface CommentProps {
  comment: CommentType;
  depth?: number;
  newsId: string;
  currentUserId?: string;
  userRole?: string;
  onVote?: (commentId: string, direction: 'up' | 'down') => void;
  onReply?: (parentId: string, content: string) => void;
  onReport?: (commentId: string, reason: string) => void;
  onPin?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onApprove?: (commentId: string) => void;
  onReject?: (commentId: string) => void;
}

export default function CommentComponent({
  comment,
  depth = 0,
  newsId,
  currentUserId,
  userRole,
  onVote,
  onReply,
  onReport,
  onPin,
  onDelete,
  onApprove,
  onReject,
}: CommentProps) {
  const [voteDirection, setVoteDirection] = useState<'up' | 'down' | null>(null);
  const [netScore, setNetScore] = useState(comment.likes - comment.dislikes);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [localReplies, setLocalReplies] = useState<CommentType[]>(comment.replies || []);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 3);
  const [toast, setToast] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isModerator = userRole === 'moderator' || userRole === 'editor' || userRole === 'admin';
  const isDeleted = comment.status === 'deleted_by_user' || comment.status === 'deleted_by_moderator';
  const isPending = comment.status === 'pending';
  const isRejected = comment.status === 'rejected';
  const isVisible = comment.status === 'approved' || comment.status === 'pending';

  const levelStyle = LEVEL_STYLES[comment.userLevel] || LEVEL_STYLES['новичок'];
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ru });

  const depthPad = Math.min(depth, 3);
  const paddingClass = DEPTH_PADDING[depthPad];
  const borderClass = DEPTH_BORDER[depthPad];
  const needsCollapse = depth >= 3 && localReplies.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showReplyForm && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showReplyForm]);

  const handleVote = useCallback((dir: 'up' | 'down') => {
    if (voteDirection === dir) {
      setNetScore(prev => dir === 'up' ? prev - 1 : prev + 1);
      setVoteDirection(null);
    } else {
      if (voteDirection === 'up') {
        setNetScore(prev => prev - 2);
      } else if (voteDirection === 'down') {
        setNetScore(prev => prev + 2);
      } else {
        setNetScore(prev => dir === 'up' ? prev + 1 : prev - 1);
      }
      setVoteDirection(dir);
      onVote?.(comment.id, dir);
    }
  }, [voteDirection, comment.id, onVote]);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    const newReply: CommentType = {
      id: `reply-${Date.now()}`,
      newsId,
      userId: currentUserId || 'u-anon',
      author: { name: 'Вы', avatar: '', karma: 0 },
      userLevel: 'новичок',
      parentId: comment.id,
      content: replyContent,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      isEdited: false,
      status: 'approved',
    };
    setLocalReplies(prev => [...prev, newReply]);
    setReplyContent('');
    setShowReplyForm(false);
    onReply?.(comment.id, replyContent);
  };

  const handleReport = (reason: string) => {
    onReport?.(comment.id, reason);
    setShowMoreMenu(false);
    setToast('Жалоба отправлена');
    setTimeout(() => setToast(null), 3000);
  };

  const handlePin = () => {
    onPin?.(comment.id);
    setShowMoreMenu(false);
  };

  const handleDelete = () => {
    onDelete?.(comment.id);
    setShowMoreMenu(false);
  };

  const handleApprove = () => {
    onApprove?.(comment.id);
    setShowMoreMenu(false);
  };

  const handleReject = () => {
    onReject?.(comment.id);
    setShowMoreMenu(false);
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    setReplyContent(el.value);
  };

  const replyCount = localReplies.length;
  const hasReplies = replyCount > 0;

  const replyLabel = replyCount === 1
    ? '1 ответ'
    : `${replyCount} ${replyCount < 5 ? 'ответа' : 'ответов'}`;

  return (
    <article
      className={`${depth > 0 ? 'mt-3' : 'mt-4'} ${paddingClass} ${borderClass}`}
      aria-label={`Комментарий от ${comment.author.name}`}
      role="comment"
    >
      {isDeleted ? (
        <div className="flex items-center gap-2 py-2 px-3 bg-[var(--bg-surface)]">
          <Trash2 size={14} className="text-[var(--text-muted)] shrink-0" />
          <span className="sakh-caption text-[var(--text-muted)]">
            {comment.status === 'deleted_by_moderator'
              ? 'Комментарий удалён модератором'
              : 'Комментарий удалён пользователем'}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-center gap-0.5 min-w-[28px]">
              <motion.button
                whileTap={{ scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400 }}
                onClick={() => handleVote('up')}
                className={`p-0.5 rounded transition-colors ${
                  voteDirection === 'up'
                    ? 'text-[var(--accent-ocean)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--accent-ocean)]'
                }`}
                aria-label="Нравится"
              >
                <ChevronUp size={16} />
              </motion.button>
              <span
                className={`text-xs font-mono tabular-nums leading-none ${
                  voteDirection === 'up'
                    ? 'text-[var(--accent-ocean)]'
                    : voteDirection === 'down'
                    ? 'text-[var(--accent-sunset)]'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {netScore}
              </span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400 }}
                onClick={() => handleVote('down')}
                className={`p-0.5 rounded transition-colors ${
                  voteDirection === 'down'
                    ? 'text-[var(--accent-sunset)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--accent-sunset)]'
                }`}
                aria-label="Не нравится"
              >
                <ChevronDown size={16} />
              </motion.button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[160px]">
                  {comment.author.name}
                </span>
                <span className={`sakh-tag text-[10px] px-1 py-0 leading-none border-none ${levelStyle.className}`}>
                  {levelStyle.label}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {formattedDate}
                </span>
                {comment.isPinned && (
                  <span className="sakh-tag sakh-tag--accent text-[10px] px-1 py-0">
                    <Pin size={10} />
                    Закреплено
                  </span>
                )}
                {isPending && (
                  <span className="sakh-tag text-[10px] px-1 py-0 leading-none bg-[#F59E0B20] text-[#F59E0B] border-none">
                    На модерации
                  </span>
                )}
                {isRejected && (
                  <span className="sakh-tag sakh-tag--sunset text-[10px] px-1 py-0">
                    Отклонён
                  </span>
                )}
                {comment.isEdited && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    (ред.)
                  </span>
                )}
              </div>

              {isVisible && (
                <p className="text-sm leading-relaxed mb-1.5 text-[var(--text-primary)]">
                  {comment.content}
                </p>
              )}
              {isRejected && (
                <p className="text-sm leading-relaxed mb-1.5 text-[var(--text-muted)] italic">
                  {comment.content}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setShowReplyForm(prev => !prev)}
                  className="flex items-center gap-1 px-1 py-0.5 transition-colors text-[var(--text-muted)] hover:text-[var(--accent-ocean)]"
                  aria-label="Ответить"
                >
                  <Reply size={12} />
                  Ответить
                </button>

                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(prev => !prev)}
                    className="flex items-center gap-1 px-1 py-0.5 transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label="Дополнительные действия"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  <AnimatePresence>
                    {showMoreMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1 z-[var(--z-dropdown)] min-w-[180px] bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-lg"
                      >
                        <div className="py-1">
                          {REPORT_REASONS.map(reason => (
                            <button
                              key={reason}
                              onClick={() => handleReport(reason)}
                              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <AlertTriangle size={12} />
                              Пожаловаться: {reason.toLowerCase()}
                            </button>
                          ))}
                          {isModerator && (
                            <>
                              <div className="border-t border-[var(--border-color)] my-1" />
                              <button
                                onClick={handlePin}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                <Pin size={12} />
                                {comment.isPinned ? 'Открепить' : 'Закрепить'}
                              </button>
                              <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--accent-sunset)] hover:bg-[var(--bg-surface)] transition-colors"
                              >
                                <Trash2 size={12} />
                                Удалить
                              </button>
                              {isPending && (
                                <>
                                  <button
                                    onClick={handleApprove}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
                                  >
                                    <CheckCircle size={12} />
                                    Одобрить
                                  </button>
                                  <button
                                    onClick={handleReject}
                                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-[var(--accent-sunset)] hover:bg-[var(--bg-surface)] transition-colors"
                                  >
                                    <XCircle size={12} />
                                    Отклонить
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {showReplyForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleReplySubmit}
                    className="mt-2 overflow-hidden"
                  >
                    <textarea
                      ref={textareaRef}
                      value={replyContent}
                      onChange={autoResize}
                      placeholder="Написать ответ..."
                      className="sakh-input w-full text-sm min-h-[60px] resize-none mb-2"
                      aria-label="Текст ответа"
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!replyContent.trim()}
                        className="sakh-btn sakh-btn--primary sakh-btn--sm"
                      >
                        Отправить
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReplyForm(false);
                          setReplyContent('');
                        }}
                        className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {hasReplies && (
            <div className="mt-2">
              {needsCollapse && (
                <button
                  onClick={() => setShowReplies(prev => !prev)}
                  className="text-xs font-mono mb-2 transition-colors text-[var(--text-muted)] hover:text-[var(--accent-ocean)]"
                >
                  {showReplies ? 'Скрыть ответы' : `Показать ${replyLabel}`}
                </button>
              )}
              <AnimatePresence initial={false}>
                {showReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {localReplies.map((reply) => (
                      <CommentComponent
                        key={reply.id}
                        comment={{
                          ...reply,
                          userLevel: reply.userLevel || getKarmaLevel(reply.author?.karma || 0),
                        }}
                        depth={depth + 1}
                        newsId={newsId}
                        currentUserId={currentUserId}
                        userRole={userRole}
                        onVote={onVote}
                        onReply={onReply}
                        onReport={onReport}
                        onPin={onPin}
                        onDelete={onDelete}
                        onApprove={onApprove}
                        onReject={onReject}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 sakh-toast sakh-toast--success z-[var(--z-toast)]"
            role="status"
            aria-live="polite"
          >
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
