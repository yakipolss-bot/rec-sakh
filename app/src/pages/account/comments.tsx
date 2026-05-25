import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import apiClient from '@/services/api-client';
import EmptyState from '@/components/EmptyState';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserComment {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  status: string;
  newsId: string;
  newsTitle?: string;
}

export default function AccountComments() {
  const { user } = useUser();
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function fetch() {
      try {
        const { data } = await apiClient.get('/comments', { params: { authorId: user.id, perPage: 50 } });
        const body = data.data || data || [];
        setComments(Array.isArray(body) ? body : []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/comments/${id}`);
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Комментарий удалён');
    } catch {
      toast.error('Ошибка при удалении');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {comments.length === 0 ? (
        <EmptyState
          title="Нет комментариев"
          description="Вы ещё не написали ни одного комментария"
          icon={<MessageSquare size={48} />}
        />
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="sakh-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="sakh-meta text-xs">
                      {format(new Date(comment.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                    </span>
                    <span className="flex items-center gap-1 sakh-meta text-xs">
                      <ThumbsUp size={10} /> {comment.likes}
                    </span>
                    <span className="flex items-center gap-1 sakh-meta text-xs">
                      <ThumbsDown size={10} /> {comment.dislikes}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleting === comment.id}
                  className="shrink-0 p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-sunset)] transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
