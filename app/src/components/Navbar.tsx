import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Focus, User, Menu, X, ChevronDown, MapPin } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { AnimatePresence, motion } from 'framer-motion';

const mainCategories = [
  { label: 'ОБЩЕСТВО', href: '/category/obshchestvo' },
  { label: 'ПРОИСШЕСТВИЯ', href: '/category/proisshestviya' },
  { label: 'ЭКОНОМИКА', href: '/category/ekonomika' },
  { label: 'СПОРТ', href: '/category/sport' },
  { label: 'КУЛЬТУРА', href: '/category/kultura' },
];

const moreCategories = [
  { label: 'Политика', href: '/category/politika' },
  { label: 'Наука и IT', href: '/category/nauka' },
  { label: 'Природа', href: '/category/priroda' },
  { label: 'Транспорт', href: '/category/transport' },
  { label: 'ЖКХ', href: '/category/zhkh' },
  { label: 'Образование', href: '/category/obrazovanie' },
  { label: 'Здоровье', href: '/category/zdravookhranenie' },
];

const serviceLinks = [
  { label: 'Погода', href: '/weather' },
  { label: 'Афиша', href: '/events' },
  { label: 'Объявления', href: '/ads' },
  { label: 'Курс валют', href: '/currency' },
  { label: 'Работа', href: '/jobs' },
  { label: 'Транспорт', href: '/transport' },
  { label: 'Телепрограмма', href: '/tv' },
  { label: 'Кроссворды', href: '/crosswords' },
  { label: 'Гороскоп', href: '/horoscope' },
  { label: 'Справочник', href: '/directory' },
  { label: 'Медиа', href: '/media' },
  { label: 'Недвижимость', href: '/realty' },
];

const quickLinks = [
  { label: 'Погода', href: '/weather' },
  { label: 'Курс валют', href: '/currency' },
  { label: 'Афиша', href: '/events' },
  { label: 'Работа', href: '/jobs' },
];

const themeIcons: Record<string, React.ReactNode> = {
  morning: <Sun size={16} />,
  day: <Sun size={16} />,
  evening: <Sun size={16} />,
  focus: <Focus size={16} />,
  night: <Moon size={16} />,
};

const themeCycle: string[] = ['night', 'morning', 'day', 'evening', 'focus'];
const themeLabels: Record<string, string> = {
  night: 'Ночь',
  morning: 'Утро',
  day: 'День',
  evening: 'Вечер',
  focus: 'Фокус',
};

function SearchContent({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Поиск по порталу
        </span>
        <button onClick={onClose} className="p-2" style={{ color: 'var(--text-secondary)' }}>
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Search size={20} style={{ color: 'var(--accent-ocean)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Новости, события, объявления..."
            className="flex-1 bg-transparent text-lg outline-none"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
          />
        </div>
      </form>
      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Популярное:</span>
        {['Погода', 'Происшествия', 'Спорт', 'Курс валют'].map((tag) => (
          <button
            key={tag}
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(tag)}`);
              onClose();
            }}
            className="px-3 py-1 text-xs transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]"
          style={{ backgroundColor: 'rgba(10, 15, 20, 0.92)', backdropFilter: 'blur(16px)' }}
        >
          <SearchContent key="search-content" onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[65] w-80 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderLeft: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-sm font-mono uppercase tracking-wider" style={{ color: 'var(--accent-ocean)' }}>
                Меню
              </span>
              <button onClick={onClose} className="p-2" style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Новости</p>
                {[...mainCategories, ...moreCategories].map((s) => (
                  <Link
                    key={s.href}
                    to={s.href}
                    onClick={onClose}
                    className="block px-3 py-2.5 text-sm transition-colors"
                    style={{
                      color: isActive(s.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)',
                      backgroundColor: isActive(s.href) ? 'var(--ocean-alpha-10)' : 'transparent',
                    }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Сервисы</p>
                {serviceLinks.map((s) => (
                  <Link
                    key={s.href}
                    to={s.href}
                    onClick={onClose}
                    className="block px-3 py-2.5 text-sm transition-colors"
                    style={{ color: isActive(s.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)' }}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <Link
                  to="/account"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <User size={16} />
                  Личный кабинет
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handlePopState() {
      setMobileOpen(false);
      setSearchOpen(false);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const cycleTheme = useCallback(() => {
    const idx = themeCycle.indexOf(theme);
    const next = themeCycle[(idx + 1) % themeCycle.length];
    setTheme(next);
  }, [theme, setTheme]);

  const isActive = (href: string) => location.pathname.startsWith(href);

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <header className="fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgba(10, 15, 20, 0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border-color)' }}>
        {/* Top bar */}
        <div className="flex items-center h-10 px-4 sm:px-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-base tracking-[0.12em] uppercase" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  SAKHALIN
                </span>
                <span className="w-[2px] h-4 inline-block" style={{ backgroundColor: 'var(--accent-ocean)' }} />
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Южно-Сахалинск</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-2.5 py-1 text-xs transition-colors"
                  style={{
                    color: isActive(link.href) ? 'var(--accent-ocean)' : 'var(--text-muted)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main nav bar */}
        <div className="flex items-center h-12 px-4 sm:px-6">
          <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between">
            {/* Categories - desktop */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 overflow-hidden">
              {mainCategories.map((cat) => (
                <Link
                  key={cat.href}
                  to={cat.href}
                  className="relative px-3.5 py-2 text-sm uppercase tracking-[0.06em] transition-colors whitespace-nowrap"
                  style={{
                    color: isActive(cat.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    opacity: isActive(cat.href) ? 1 : 0.7,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = isActive(cat.href) ? '1' : '0.7'; }}
                >
                  {cat.label}
                  {isActive(cat.href) && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-[2px]"
                      style={{ backgroundColor: 'var(--accent-ocean)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center gap-1 px-3 py-2 text-sm uppercase tracking-[0.06em] whitespace-nowrap transition-opacity"
                  style={{
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                >
                  ЕЩЁ <ChevronDown size={12} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 top-full mt-1 w-52 py-1 z-50"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Рубрики
                      </div>
                      {moreCategories.map((cat) => (
                        <Link
                          key={cat.href}
                          to={cat.href}
                          onClick={() => setMoreOpen(false)}
                          className="block px-4 py-2 text-sm transition-colors"
                          style={{
                            color: isActive(cat.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)',
                          }}
                        >
                          {cat.label}
                        </Link>
                      ))}
                      <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />
                      <div className="px-3 py-1.5 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        Сервисы
                      </div>
                      {serviceLinks.map((svc) => (
                        <Link
                          key={svc.href}
                          to={svc.href}
                          onClick={() => setMoreOpen(false)}
                          className="block px-4 py-2 text-sm transition-colors"
                          style={{ color: isActive(svc.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)' }}
                        >
                          {svc.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Поиск"
              >
                <Search size={18} />
              </button>

              <button
                onClick={cycleTheme}
                className="p-2 transition-colors hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={themeLabels[theme]}
                title={themeLabels[theme]}
              >
                {themeIcons[theme] || <Sun size={16} />}
              </button>

              <div className="relative hidden sm:block" ref={userRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-2 py-2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  aria-label="Пользователь"
                >
                  <div
                    className="w-6 h-6 flex items-center justify-center text-xs font-mono"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--accent-ocean)',
                    }}
                  >
                    <User size={14} />
                  </div>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 w-44 py-1 z-50"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <Link
                        to="/login"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Войти
                      </Link>
                      <Link
                        to="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Личный кабинет
                      </Link>
                      <div className="my-1 border-t" style={{ borderColor: 'var(--border-color)' }} />
                      <Link
                        to="/editorial"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Редакция
                      </Link>
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Админка
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Меню"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
