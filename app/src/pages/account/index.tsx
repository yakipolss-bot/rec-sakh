import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Heart, MapPin, Calendar, Award, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { currentUser } from '@/data/mock';
import { accountActivity } from '@/data/accountMock';

const statCards = [
  { icon: MessageSquare, label: 'Комментариев', value: currentUser.commentsCount, path: '/account/comments' },
  { icon: FileText, label: 'Объявлений', value: currentUser.adsCount, path: '/account/ads' },
  { icon: Heart, label: 'В избранном', value: 12, path: '/account/favorites' },
];

const quickActions = [
  { label: 'Написать комментарий', path: '/account/comments', icon: MessageSquare },
  { label: 'Подать объявление', path: '/account/ads', icon: FileText },
  { label: 'Написать в редакцию', path: '/account/support', icon: ArrowRight },
];

const activityIcons: Record<string, React.ReactNode> = {
  comment: <MessageSquare size={14} />,
  ad: <FileText size={14} />,
  favorite: <Heart size={14} />,
  login: <ArrowRight size={14} />,
  subscription: <Heart size={14} />,
};

const formattedDate = format(new Date(currentUser.registeredAt), 'd MMMM yyyy', { locale: ru });

export default function AccountDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center text-2xl font-mono uppercase bg-[var(--bg-surface)] text-[var(--accent-ocean)] border-2 border-[var(--accent-ocean)]">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-medium text-[var(--text-primary)] mb-1">
              {currentUser.name}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-2">{currentUser.email}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="sakh-tag sakh-tag--accent">{currentUser.level}</span>
              <span className="sakh-meta sakh-meta--with-icon">
                <Award size={12} />
                Карма: {currentUser.karma}
              </span>
              <span className="sakh-meta sakh-meta--with-icon">
                <MapPin size={12} />
                {currentUser.city}
              </span>
              <span className="sakh-meta sakh-meta--with-icon">
                <Calendar size={12} />
                С {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(card => (
          <Link key={card.label} to={card.path} className="sakh-card p-4 flex items-center gap-3">
            <card.icon size={20} className="text-[var(--accent-ocean)]" />
            <div>
              <p className="text-2xl font-mono font-medium text-[var(--text-primary)]">{card.value}</p>
              <p className="sakh-meta">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.path}
              className="sakh-card p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-primary)]">{action.label}</span>
              </div>
              <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-ocean)] transition-colors" />
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sakh-card p-4">
          <h3 className="sakh-caption font-medium mb-4">Последняя активность</h3>
          <div className="space-y-3">
            {accountActivity.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-[var(--text-muted)]">
                  {activityIcons[activity.type]}
                </span>
                <div className="flex-1 min-w-0">
                  {activity.link ? (
                    <Link to={activity.link} className="text-[var(--text-primary)] hover:text-[var(--accent-ocean)] transition-colors line-clamp-1">
                      {activity.description}
                    </Link>
                  ) : (
                    <p className="text-[var(--text-primary)] line-clamp-1">{activity.description}</p>
                  )}
                  <p className="sakh-meta text-xs mt-1">
                    {format(new Date(activity.date), 'd MMM, HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sakh-card p-4">
          <h3 className="sakh-caption font-medium mb-4">Мои подписки</h3>
          <div className="flex flex-wrap gap-2">
            {currentUser.subscriptions.map(sub => (
              <span key={sub} className="sakh-tag sakh-tag--accent">{sub}</span>
            ))}
          </div>
          <Link to="/account/subscriptions" className="sakh-link text-xs mt-4 inline-block">
            Управлять подписками
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
