import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Heart, MapPin, Calendar, Award, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useUser, useUserActivity, useUserSubscriptions } from '@/hooks/useUser';

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

export default function AccountDashboard() {
  const { user, isLoading: userLoading, error: userError, refetch: refetchUser } = useUser();
  const { activity } = useUserActivity();
  const { subscriptions } = useUserSubscriptions();

  if (userError) {
    return (
      <div className="sakh-card p-4 text-center">
        <p className="text-[var(--accent-sunset)]">Ошибка загрузки профиля</p>
        <button onClick={() => refetchUser?.()} className="sakh-btn sakh-btn--sm mt-4">
          Перезагрузить
        </button>
      </div>
    );
  }

  if (userLoading || !user) {
    return (
      <div className="space-y-4">
        <div className="sakh-card p-4 animate-pulse h-32"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="sakh-card p-4 h-24 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: MessageSquare, label: 'Комментариев', value: user.commentsCount || 0, path: '/account/comments' },
    { icon: FileText, label: 'Объявлений', value: user.adsCount || 0, path: '/account/ads' },
    { icon: Heart, label: 'В избранном', value: 0, path: '/account/favorites' },
  ];

  const formattedDate = format(new Date(user.registeredAt), 'd MMMM yyyy', { locale: ru });

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
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-medium text-[var(--text-primary)] mb-1">
              {user.name}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-2">{user.email}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="sakh-tag sakh-tag--accent">{user.level}</span>
              <span className="sakh-meta sakh-meta--with-icon">
                <Award size={12} />
                Карма: {user.karma}
              </span>
              <span className="sakh-meta sakh-meta--with-icon">
                <MapPin size={12} />
                {user.city}
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
            {activity.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-[var(--text-muted)]">
                  {activityIcons[act.type]}
                </span>
                <div className="flex-1 min-w-0">
                  {act.link ? (
                    <Link to={act.link} className="text-[var(--text-primary)] hover:text-[var(--accent-ocean)] transition-colors line-clamp-1">
                      {act.description}
                    </Link>
                  ) : (
                    <p className="text-[var(--text-primary)] line-clamp-1">{act.description}</p>
                  )}
                  <p className="sakh-meta text-xs mt-1">
                    {format(new Date(act.date), 'd MMM, HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sakh-card p-4">
          <h3 className="sakh-caption font-medium mb-4">Мои подписки</h3>
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((sub) => (
              <span key={sub.id} className="sakh-tag sakh-tag--accent">{sub.value}</span>
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
