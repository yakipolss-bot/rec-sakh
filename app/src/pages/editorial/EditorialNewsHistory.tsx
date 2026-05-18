import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Edit, User } from 'lucide-react';
import { getNewsById } from '@/data/mock';

const mockHistory = [
  { id: 'h1', user: 'Анна Кузнецова', action: 'Создал материал', timestamp: '2026-05-16 10:30', field: null },
  { id: 'h2', user: 'Мария Соколова', action: 'Изменил заголовок', timestamp: '2026-05-16 11:15', field: 'title' },
  { id: 'h3', user: 'Мария Соколова', action: 'Изменил лид', timestamp: '2026-05-16 11:16', field: 'lead' },
  { id: 'h4', user: 'Иван Петров', action: 'Добавил теги', timestamp: '2026-05-16 11:45', field: 'tags' },
  { id: 'h5', user: 'Иван Петров', action: 'Изменил рубрику', timestamp: '2026-05-16 12:00', field: 'category' },
  { id: 'h6', user: 'Дмитрий Волков', action: 'Опубликовал', timestamp: '2026-05-16 14:30', field: 'status' },
];

export default function EditorialNewsHistory() {
  const { id } = useParams<{ id: string }>();
  const article = getNewsById(id || '');

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
          <ArrowLeft size={14} className="inline mr-1" />
          К списку
        </Link>
        <span className="sakh-meta">История изменений: {article.title}</span>
      </div>

      <div className="sakh-card p-4 max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[var(--accent-ocean)]" />
          <h2 className="sakh-caption text-[var(--text-secondary)]">История изменений</h2>
        </div>

        <div className="space-y-0">
          {mockHistory.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 py-3 border-b border-[var(--border-color)] last:border-0"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0 mt-0.5">
                <User size={12} className="text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-medium">{entry.user}</span>
                  {' '}{entry.action}
                </p>
                <p className="sakh-meta">{entry.timestamp}</p>
              </div>
              {entry.field && (
                <span className="sakh-tag sakh-tag--muted">{entry.field}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
