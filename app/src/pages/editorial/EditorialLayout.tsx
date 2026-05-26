import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import RouteGuard from '@/components/RouteGuard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, FileText, Layers, Tag, MessageSquare,
  Camera, Video, DollarSign, Send, Globe, Activity,
  Calendar, Menu, X, ChevronRight, Users, Zap, Search,
  Loader2,
} from 'lucide-react';
import usersService from '@/services/users.service';
import type { UserProfile } from '@/models/users/UserProfile';

const navSections = [
  {
    label: 'Главное',
    items: [
      { path: '/editorial', icon: BarChart3, label: 'Дашборд' },
      { path: '/editorial/news', icon: FileText, label: 'Новости' },
      { path: '/editorial/categories', icon: Layers, label: 'Рубрики' },
      { path: '/editorial/tags', icon: Tag, label: 'Теги' },
    ],
  },
  {
    label: 'Контент',
    items: [
      { path: '/editorial/events', icon: Calendar, label: 'Афиша' },
      { path: '/editorial/media/photos', icon: Camera, label: 'Фото' },
      { path: '/editorial/media/videos', icon: Video, label: 'Видео' },
      { path: '/editorial/comments', icon: MessageSquare, label: 'Комментарии' },
      { path: '/editorial/ads', icon: DollarSign, label: 'Объявления' },
    ],
  },
  {
    label: 'Коммуникации',
    items: [
      { path: '/editorial/newsletters', icon: Send, label: 'Рассылки' },
    ],
  },
  {
    label: 'Настройки',
    items: [
      { path: '/editorial/seo', icon: Globe, label: 'SEO' },
      { path: '/editorial/analytics', icon: Activity, label: 'Аналитика' },
    ],
  },
];

export default function EditorialLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: user } = useQuery({
    queryKey: ['editorial', 'me'],
    queryFn: () => usersService.getMe().catch(() => null),
  });
  const isActive = (path: string) => {
    if (path === '/editorial') return location.pathname === '/editorial';
    return location.pathname.startsWith(path);
  };

  const userRole = user?.role;
  const visibleSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (userRole === 'moderator') {
        const allowed = ['/editorial/comments', '/editorial/ads'];
        return allowed.includes(item.path);
      }
      return true;
    }),
  })).filter(section => section.items.length > 0);

  return (
    <RouteGuard roles={['journalist', 'proofreader', 'editor', 'chief_editor', 'moderator', 'admin', 'superadmin']}>
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
          <Link to="/editorial" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--accent-ocean)] flex items-center justify-center">
              <Zap size={16} className="text-[var(--bg-primary)]" />
            </div>
            <span className="sakh-caption text-[var(--accent-ocean)]">Редакция</span>
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
            {user ? (
              user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users size={16} className="text-[var(--text-muted)]" />
              )
            ) : (
              <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="sakh-caption text-[var(--text-primary)] truncate">{user?.name || 'Загрузка...'}</p>
            <p className="sakh-meta">{user?.role || ''}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {visibleSections.map((section) => (
            <div key={section.label}>
              <p className="sakh-meta px-2 mb-1">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      isActive(item.path)
                        ? 'bg-[var(--accent-ocean-20)] text-[var(--accent-ocean)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <item.icon size={16} />
                    <span className="font-mono text-xs tracking-wider uppercase">{item.label}</span>
                    {isActive(item.path) && <ChevronRight size={14} className="ml-auto" />}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--border-color)]">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Zap size={14} />
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
          <div className="sakh-search max-w-xs hidden sm:block">
            <Search className="sakh-search__icon" size={14} />
            <input
              type="text"
              placeholder="Поиск в редакции..."
              className="sakh-search__input !h-9 !text-xs !pl-8"
            />
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="max-w-[1600px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
    </RouteGuard>
  );
}
