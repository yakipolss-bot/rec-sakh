import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Briefcase, Shield, FileText,
  Megaphone, DollarSign, Settings, Server, ExternalLink,
  Menu, X, ChevronRight, Newspaper, MessageSquare, FolderTree, Image,
} from 'lucide-react';
import { usersService } from '@/services';
import type { UserProfile } from '@/services/users.service';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Дашборд', exact: true },
  { path: '/admin/users', icon: Users, label: 'Пользователи' },
  { path: '/admin/staff', icon: Briefcase, label: 'Сотрудники' },
  { path: '/admin/moderation', icon: Shield, label: 'Модерация' },
  { path: '/admin/news', icon: Newspaper, label: 'Новости' },
  { path: '/admin/comments', icon: MessageSquare, label: 'Комментарии' },
  { path: '/admin/categories', icon: FolderTree, label: 'Рубрики' },
  { path: '/admin/media', icon: Image, label: 'Медиатека' },
  { path: '/admin/content', icon: FileText, label: 'Контент' },
  { path: '/admin/advertising', icon: Megaphone, label: 'Реклама' },
  { path: '/admin/billing', icon: DollarSign, label: 'Финансы' },
  { path: '/admin/settings', icon: Settings, label: 'Настройки' },
  { path: '/admin/system', icon: Server, label: 'Система' },
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    usersService.getMe().then(setUser).catch(() => setUser(null));
  }, []);

  const isActive = (item: typeof navItems[number]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const activeItem = navItems.find(isActive);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] z-50 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--accent-ocean)] flex items-center justify-center">
              <span className="text-[var(--bg-primary)] font-mono text-xs font-bold">A</span>
            </div>
            <span className="sakh-caption text-[var(--accent-ocean)]">Админ-панель</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]">
          <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[var(--text-muted)] font-mono text-sm">
                {user?.name?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="sakh-caption text-[var(--text-primary)] truncate">{user?.name || 'Загрузка...'}</p>
            <p className="sakh-meta">{user?.role === 'admin' ? 'Администратор' : user?.role || ''}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-l-2 ${
                  active
                    ? 'bg-[var(--accent-ocean-20)] text-[var(--accent-ocean)] border-[var(--accent-ocean)]'
                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <Icon size={16} />
                <span className="font-mono text-xs tracking-wider uppercase">{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border-color)]">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ExternalLink size={14} />
            На сайт
          </Link>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="lg:hidden flex items-center gap-2 text-sm font-mono text-[var(--text-muted)]">
            {activeItem && (() => { const Icon = activeItem.icon; return <Icon size={14} />; })()}
            <span>{activeItem?.label ?? 'Админ-панель'}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="sakh-meta">{user?.level || ''}</span>
            <div className="w-2 h-2 rounded-full bg-[var(--accent-ocean)]" />
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[1600px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
