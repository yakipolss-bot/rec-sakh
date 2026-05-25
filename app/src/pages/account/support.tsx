import { useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Send, MessageSquare, Phone, Mail, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSupport() {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Заполните тему и сообщение');
      return;
    }
    setSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Сообщение отправлено. Мы ответим вам в ближайшее время.');
      setForm({ subject: '', message: '' });
    } catch {
      toast.error('Ошибка при отправке');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <Headphones size={16} className="text-[var(--accent-ocean)]" />
          Написать в поддержку
        </h3>

        <div className="space-y-4">
          <div>
            <label className="sakh-caption block mb-1">Тема</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
              className="sakh-input"
              placeholder="Кратко опишите вопрос"
            />
          </div>
          <div>
            <label className="sakh-caption block mb-1">Сообщение</label>
            <textarea
              value={form.message}
              onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
              className="sakh-textarea min-h-[120px]"
              placeholder="Подробно опишите вашу проблему или вопрос..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="sakh-btn sakh-btn--primary sakh-btn--lg flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? 'Отправка...' : (
                <>
                  <Send size={14} />
                  Отправить
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4">Другие способы связи</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 border border-[var(--border-color)]">
            <Mail size={18} className="text-[var(--accent-ocean)] shrink-0" />
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">Email</p>
              <a href="mailto:support@sakh.com" className="text-xs text-[var(--accent-ocean)] hover:underline">support@sakh.com</a>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-[var(--border-color)]">
            <MessageSquare size={18} className="text-[var(--accent-ocean)] shrink-0" />
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">Telegram</p>
              <span className="text-xs text-[var(--text-secondary)]">@sakh_support</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border border-[var(--border-color)]">
            <HelpCircle size={18} className="text-[var(--accent-ocean)] shrink-0" />
            <div>
              <p className="text-xs font-medium text-[var(--text-primary)]">FAQ</p>
              <span className="text-xs text-[var(--text-secondary)]">Часто задаваемые вопросы</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
