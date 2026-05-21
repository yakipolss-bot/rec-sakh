import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Mail, RefreshCw, Eye, BarChart3, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';

const typeLabels: Record<string, string> = {
  digest: 'Дайджест',
  urgent: 'Экстренная',
  thematic: 'Тематическая',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  scheduled: 'bg-[var(--accent-ocean)]',
  sending: 'bg-yellow-500',
  sent: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function EditorialNewsletters() {
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'digest' | 'urgent' | 'thematic'>('digest');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await adminService.getNewsletters();
      setNewsletters(data);
    } catch {
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Заполните тему и содержание');
      return;
    }
    setSending(true);
    try {
      await adminService.createNewsletter({ title: subject, content, type });
      toast.success('Рассылка создана');
      setShowCreate(false);
      setSubject('');
      setContent('');
      setType('digest');
      fetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Ошибка создания');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await adminService.sendNewsletter(id);
      toast.success('Рассылка отправлена');
      fetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Ошибка отправки');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Рассылки</h1>
          <p className="sakh-meta mt-1">Управление email-рассылками</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="sakh-btn sakh-btn--ghost sakh-btn--md" title="Обновить">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="sakh-btn sakh-btn--primary sakh-btn--md">
            <Plus size={14} />
            Создать рассылку
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sakh-card p-4 mb-6"
          >
            <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Новая рассылка</h3>
            <div className="space-y-4">
              <div>
                <label className="sakh-caption block mb-1">Тема</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Тема письма"
                  className="sakh-input"
                />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Тип</label>
                <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="sakh-select">
                  <option value="digest">Дайджест</option>
                  <option value="urgent">Экстренная</option>
                  <option value="thematic">Тематическая</option>
                </select>
              </div>
              <div>
                <label className="sakh-caption block mb-1">Содержание</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Текст рассылки..."
                  className="sakh-textarea min-h-[200px]"
                  rows={8}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={sending}
                  className="sakh-btn sakh-btn--primary sakh-btn--md"
                >
                  {sending ? 'Сохранение...' : <><Plus size={14} /> Создать</>}
                </button>
                <button onClick={() => setShowCreate(false)} className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : newsletters.length === 0 ? (
        <div className="sakh-card p-8 text-center">
          <Mail size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h3 className="sakh-title mb-2">Рассылок пока нет</h3>
          <p className="sakh-body text-sm text-[var(--text-secondary)]">
            Создайте первую рассылку, нажав на кнопку выше.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="px-3 py-2 text-left sakh-caption">Тема</th>
                <th className="px-3 py-2 text-left sakh-caption">Тип</th>
                <th className="px-3 py-2 text-left sakh-caption">Статус</th>
                <th className="px-3 py-2 text-left sakh-caption">Отправлено</th>
                <th className="px-3 py-2 text-left sakh-caption">Открыто</th>
                <th className="px-3 py-2 text-left sakh-caption">Создана</th>
                <th className="px-3 py-2 text-left sakh-caption" />
              </tr>
            </thead>
            <tbody>
              {newsletters.map((n: any) => (
                <tr key={n.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-elevated)]">
                  <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{n.title}</td>
                  <td className="px-3 py-2">{typeLabels[n.type] || n.type}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${statusColors[n.status] || 'bg-gray-400'}`} />
                    <span className="ml-1.5 sakh-meta">{n.status}</span>
                  </td>
                  <td className="px-3 py-2 sakh-meta">{n.stats?.sentCount ?? '—'}</td>
                  <td className="px-3 py-2 sakh-meta">{n.stats?.openedCount ?? '—'}</td>
                  <td className="px-3 py-2 sakh-meta">{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {n.status === 'draft' && (
                        <button
                          onClick={() => handleSend(n.id)}
                          className="sakh-btn sakh-btn--primary sakh-btn--xs"
                          title="Отправить"
                        >
                          <Send size={12} />
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            const stats = await adminService.getNewsletterStats(n.id);
                            setSelected({ ...n, stats });
                          } catch { setSelected(n); }
                        }}
                        className="sakh-btn sakh-btn--ghost sakh-btn--xs"
                        title="Статистика"
                      >
                        <BarChart3 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="sakh-card p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="sakh-title">Статистика</h3>
                <button onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>
              <p className="sakh-meta mb-4">{selected.title}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Отправлено', value: selected.stats?.sentCount ?? 0 },
                  { label: 'Открыто', value: selected.stats?.openedCount ?? 0 },
                  { label: 'Кликов', value: selected.stats?.clickedCount ?? 0 },
                  { label: 'Отписалось', value: selected.stats?.unsubscribedCount ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="p-3 bg-[var(--bg-surface)] text-center">
                    <p className="text-2xl font-bold text-[var(--accent-ocean)]">{s.value}</p>
                    <p className="sakh-meta">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
