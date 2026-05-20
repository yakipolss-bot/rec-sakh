import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, MessageSquare, FileText, Briefcase,
  Calendar, Bell, Bookmark, CreditCard, Headphones, ChevronDown,
  LogOut, Lock, Eye, Settings, Heart
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

export const accountNavItems = [
  { path: '/account', label: 'Дашборд', icon: LayoutDashboard, exact: true },
  { path: '/account/profile', label: 'Профиль', icon: User },
  { path: '/account/security', label: 'Безопасность', icon: Lock },
  { path: '/account/notifications', label: 'Уведомления', icon: Bell },
  { path: '/account/privacy', label: 'Приватность', icon: Eye },
  { path: '/account/comments', label: 'Комментарии', icon: MessageSquare },
  { path: '/account/ads', label: 'Объявления', icon: FileText },
  { path: '/account/jobs', label: 'Работа', icon: Briefcase },
  { path: '/account/events', label: 'События', icon: Calendar },
  { path: '/account/subscriptions', label: 'Подписки', icon: Heart },
  { path: '/account/favorites', label: 'Избранное', icon: Bookmark },
  { path: '/account/billing', label: 'Платежи', icon: CreditCard },
  { path: '/account/support', label: 'Поддержка', icon: Headphones },
];

export default function AccountLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, error } = useUser();

  const handleLogout = useCallback(async () => {
    await authService.logout();
    navigate('/login');
  }, [navigate]);

  const isActive = (item: typeof accountNavItems[number]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const activeItem = accountNavItems.find(isActive);

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (err) {
      toast.error('Ошибка при выходе');
    }
  };

  if (error) {
    return (
      <div className="pt-20 pb-8">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
          <div className="text-center py-12">
            <p className="text-[var(--accent-sunset)]">Ошибка загрузки профиля</p>
            <button onClick={() => window.location.reload()} className="sakh-btn sakh-btn--sm mt-4">
              Перезагрузить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="pt-20 pb-8">
        <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-[var(--bg-surface)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[var(--container-max)] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center text-lg font-mono uppercase bg-[var(--bg-surface)] text-[var(--accent-ocean)] border-2 border-[var(--accent-ocean)]">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover rounded" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-medium text-[var(--text-primary)] truncate">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">
                {user.email}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="sakh-meta">{user.level}</span>
              <span className="sakh-meta">
                Карма: {user.karma}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="sakh-btn sakh-btn--ghost sakh-btn--sm text-[var(--text-muted)]"
              title="Выйти"
            >
              <LogOut size={14} />
              <span className="hide-mobile">Выйти</span>
            </button>
          </div>
        </motion.div>

        <div className="flex gap-6">
          <aside className="hidden lg:flex flex-col gap-1 w-56 shrink-0">
            <nav className="sticky top-24">
              {accountNavItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-mono uppercase tracking-wider transition-colors border-l-2 ${
                      active
                        ? 'text-[var(--accent-ocean)] border-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]'
                        : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-mono uppercase tracking-wider border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              >
                <div className="flex items-center gap-3">
                  {activeItem && (() => { const Icon = activeItem.icon; return <Icon size={16} />; })()}
                  {activeItem?.label ?? 'Раздел'}
                </div>
                <ChevronDown size={16} className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {mobileOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-t-0 border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden"
                  >
                    {accountNavItems.map(item => {
                      const Icon = item.icon;
                      const active = isActive(item);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-mono uppercase tracking-wider transition-colors border-l-2 ${
                            active
                              ? 'text-[var(--accent-ocean)] border-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]'
                              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
