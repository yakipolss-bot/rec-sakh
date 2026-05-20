import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, Eye, MousePointer, Mail, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function EditorialNewsletters() {
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'digest' | 'urgent' | 'thematic'>('digest');
  const [content, setContent] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Рассылки</h1>
          <p className="sakh-meta mt-1">Управление email-рассылками</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="sakh-btn sakh-btn--primary sakh-btn--md">
          <Plus size={14} />
          Создать рассылку
        </button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
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
                onClick={() => toast.info('Модуль рассылок находится в разработке')}
                className="sakh-btn sakh-btn--primary sakh-btn--md"
              >
                <Send size={14} /> Отправить
              </button>
              <button onClick={() => setShowCreate(false)} className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="sakh-card p-8 text-center">
        <Mail size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
        <h3 className="sakh-title mb-2">Модуль рассылок скоро появится</h3>
        <p className="sakh-body text-sm text-[var(--text-secondary)]">
          Управление email-рассылками и аналитика находятся в разработке.
        </p>
      </div>
    </div>
  );
}
