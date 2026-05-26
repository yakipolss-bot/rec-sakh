import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import notificationsService from '@/services/notifications.service';
import EmptyState from '@/components/EmptyState';
import type { NotificationItem } from '@/services/notifications.service';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

type TabId = 'all' | 'unread';

const tabs: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'unread', label: 'Непрочитанные' },
];

export default function AccountNotifications() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [res, count] = await Promise.all([
        notificationsService.getAll({ perPage: 50 }),
        notificationsService.getUnreadCount().catch(() => 0),
      ]);
      setItems(res.data || []);
      setUnreadCount(count);
    } catch {
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsService.markAllAsRead();
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('Все уведомления отмечены прочитанными');
    } catch {
      toast.error('Ошибка');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.delete(id);
      const deleted = items.find(n => n.id === id);
      setItems(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Уведомление удалено');
    } catch {
      toast.error('Ошибка при удалении');
    }
  };

  const filtered = activeTab === 'unread' ? items.filter(n => !n.isRead) : items;

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
      <div className="flex items-center justify-between mb-4">
        <div className="sakh-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sakh-tabs__item ${activeTab === tab.id ? 'sakh-tabs__item--active' : ''}`}
            >
              {tab.label}
              {tab.id === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 text-xs bg-[var(--accent-ocean)] text-white rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="sakh-btn sakh-btn--ghost sakh-btn--sm flex items-center gap-1"
          >
            {markingAll ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={14} />}
            Всё прочитано
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {filtered.length === 0 ? (
            <EmptyState title="Нет уведомлений" description="Уведомления будут появляться здесь" icon={<Bell size={48} />} />
          ) : (
            <div className="space-y-1">
              {filtered.map(notification => (
                <div
                  key={notification.id}
                  className={`sakh-card p-4 transition-colors ${!notification.isRead ? 'border-l-2 border-[var(--accent-ocean)] bg-[var(--ocean-alpha-5)]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[var(--text-primary)]">{notification.title}</span>
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-ocean)] shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">{notification.body}</p>
                      <p className="sakh-meta text-xs mt-1">
                        {format(new Date(notification.createdAt), 'd MMM yyyy, HH:mm', { locale: ru })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-ocean)] transition-colors"
                          title="Отметить прочитанным"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-sunset)] transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
