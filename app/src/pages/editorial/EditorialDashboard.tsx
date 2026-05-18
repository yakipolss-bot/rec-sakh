import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Clock, Activity, Eye, MessageSquare, FileText,
  AlertTriangle, CheckCircle, XCircle, ArrowRight,
  TrendingUp, Users, Zap,
} from 'lucide-react';
import { newsArticles } from '@/data/mock';
import { editorialTasks, activityFeed } from '@/data/editorialMock';

const pendingComments = 12;
const pendingAds = 5;

const urgentNews = newsArticles.filter((n) => n.isUrgent);

export default function EditorialDashboard() {
  const todayViews = newsArticles.reduce((sum, n) => sum + n.views, 0);
  const todayComments = newsArticles.reduce((sum, n) => sum + n.commentsCount, 0);
  const todayPublished = newsArticles.filter(
    (n) => new Date(n.publishedAt).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Дашборд</h1>
          <p className="sakh-meta mt-1">Панель управления редакцией</p>
        </div>
        <Link to="/editorial/news/create" className="sakh-btn sakh-btn--primary sakh-btn--md">
          <FileText size={14} />
          Новая новость
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Eye, label: 'Просмотры сегодня', value: todayViews.toLocaleString('ru-RU'), color: 'text-[var(--accent-ocean)]' },
          { icon: MessageSquare, label: 'Комментарии', value: `${todayComments}`, color: 'text-[var(--accent-sunset)]' },
          { icon: FileText, label: 'Публикации', value: `${todayPublished}`, color: 'text-[var(--accent-ocean)]' },
          { icon: TrendingUp, label: 'Всего материалов', value: `${newsArticles.length}`, color: 'text-[var(--text-primary)]' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="sakh-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)] font-mono">{stat.value}</p>
            <p className="sakh-meta mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sakh-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2">
              <Clock size={14} />
              Мои задачи
            </h2>
            <Link to="/editorial/news" className="sakh-meta sakh-meta--accent flex items-center gap-1">
              Все <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {editorialTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 bg-[var(--bg-surface)]">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  task.priority === 'high' ? 'bg-[var(--accent-sunset)]' :
                  task.priority === 'medium' ? 'bg-[var(--accent-ocean)]' : 'bg-[var(--text-muted)]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{task.title}</p>
                  <p className="sakh-meta">{task.assignee} · {task.deadline}</p>
                </div>
                <span className={`sakh-tag ${
                  task.status === 'done' ? 'sakh-tag--accent' :
                  task.status === 'in_progress' ? 'sakh-tag--sunset' : 'sakh-tag--muted'
                }`}>
                  {task.status === 'todo' ? 'В плане' :
                   task.status === 'in_progress' ? 'В работе' :
                   task.status === 'review' ? 'На проверке' : 'Готово'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="sakh-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2">
              <Activity size={14} />
              Лента активности
            </h2>
          </div>
          <div className="space-y-2">
            {activityFeed.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-ocean)] mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">{entry.user}</span>{' '}
                    {entry.action}{' '}
                    <span className="text-[var(--accent-ocean)]">{entry.target}</span>
                  </p>
                  <p className="sakh-meta">{entry.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="sakh-card p-4"
        >
          <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2 mb-4">
            <AlertTriangle size={14} />
            Экстренное
          </h2>
          {urgentNews.length > 0 ? (
            <div className="space-y-2">
              {urgentNews.map((news) => (
                <Link
                  key={news.id}
                  to={`/editorial/news/${news.id}/edit`}
                  className="flex items-center gap-3 p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <AlertTriangle size={14} className="text-[var(--accent-sunset)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{news.title}</p>
                    <p className="sakh-meta">{news.author.name} · {news.publishedAt.slice(0, 10)}</p>
                  </div>
                  <ArrowRight size={14} className="text-[var(--text-muted)] shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="sakh-body text-sm">Нет срочных материалов</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="sakh-card p-4"
        >
          <h2 className="sakh-caption text-[var(--text-secondary)] flex items-center gap-2 mb-4">
            <Users size={14} />
            Модерация
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/editorial/comments"
              className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <MessageSquare size={24} className="text-[var(--accent-sunset)]" />
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{pendingComments}</span>
              <span className="sakh-meta text-center">Комментариев на проверке</span>
            </Link>
            <Link
              to="/editorial/ads"
              className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <DollarSign size={24} className="text-[var(--accent-ocean)]" />
              <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">{pendingAds}</span>
              <span className="sakh-meta text-center">Объявлений на премодерации</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
