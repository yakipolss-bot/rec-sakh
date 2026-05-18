import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, Eye, MousePointer, Mail } from 'lucide-react';
import { editorialNewsletters } from '@/data/editorialMock';

const typeLabels: Record<string, string> = {
  digest: 'Дайджест',
  urgent: 'Экстренная',
  thematic: 'Тематическая',
};

const typeColors: Record<string, string> = {
  digest: 'sakh-tag--accent',
  urgent: 'sakh-tag--sunset',
  thematic: 'sakh-tag--outline',
};

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
              <button className="sakh-btn sakh-btn--primary sakh-btn--md">
                <Send size={14} /> Отправить
              </button>
              <button onClick={() => setShowCreate(false)} className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              <th className="px-3 py-2 text-left sakh-caption">Тема</th>
              <th className="px-3 py-2 text-left sakh-caption">Тип</th>
              <th className="px-3 py-2 text-left sakh-caption">Дата</th>
              <th className="px-3 py-2 text-left sakh-caption">
                <div className="flex items-center gap-1"><Eye size={12} /> Открываемость</div>
              </th>
              <th className="px-3 py-2 text-left sakh-caption">
                <div className="flex items-center gap-1"><MousePointer size={12} /> Клики</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {editorialNewsletters.map((nl, i) => (
              <motion.tr
                key={nl.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-[var(--border-color)] hover:bg-[var(--bg-surface)] transition-colors"
              >
                <td className="px-3 py-3 text-[var(--text-primary)]">{nl.subject}</td>
                <td className="px-3 py-3">
                  <span className={`sakh-tag ${typeColors[nl.type] || 'sakh-tag--muted'}`}>
                    {typeLabels[nl.type] || nl.type}
                  </span>
                </td>
                <td className="px-3 py-3 sakh-meta">{nl.sentAt}</td>
                <td className="px-3 py-3 font-mono text-xs text-[var(--accent-ocean)]">{nl.openRate}%</td>
                <td className="px-3 py-3 font-mono text-xs text-[var(--text-secondary)]">{nl.clickRate}%</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
