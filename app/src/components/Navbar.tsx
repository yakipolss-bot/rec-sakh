import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Focus, User, Menu, X, ChevronDown } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import ThemeSwitcher from './ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function Navbar() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const themeIcon = effectiveTheme === 'morning'
    ? <Sun size={18} className="text-[var(--accent-sunset)]" />
    : effectiveTheme === 'night'
    ? <Moon size={18} />
    : effectiveTheme === 'focus'
    ? <Focus size={18} />
    : <Sun size={18} className={effectiveTheme === 'evening' ? 'text-[var(--accent-sunset)]' : 'text-[var(--accent-ocean)]'} />;

  const isCategoryActive = (href: string) => location.pathname.startsWith(href);
  const isServiceActive = (href: string) => location.pathname.startsWith(href);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        backgroundColor: 'rgba(10, 15, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span
            className="font-mono text-lg tracking-[0.1em] uppercase"
            style={{ color: 'var(--text-primary)', fontWeight: 500 }}
          >
            SAKHALIN
          </span>
          <span
            className="w-[2px] h-5 inline-block"
            style={{ backgroundColor: 'var(--accent-ocean)' }}
          />
        </Link>

        <div className="hidden lg:flex items-center gap-1 ml-8">
          {mainCategories.map((section) => (
            <Link
              key={section.href}
              to={section.href}
              className="relative px-3 py-2 text-sm uppercase tracking-[0.05em] transition-colors whitespace-nowrap"
              style={{
                color: isCategoryActive(section.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              {section.label}
              {isCategoryActive(section.href) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-3 right-3 h-[2px]"
                  style={{ backgroundColor: 'var(--accent-ocean)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          ))}

          <div className="relative" ref={moreRef}>
            <button
              onClick={() => { setMoreOpen(!moreOpen); setServicesOpen(false); }}
              className="flex items-center gap-1 px-3 py-2 text-sm uppercase tracking-[0.05em] transition-colors whitespace-nowrap"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              ЕЩЁ <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-56 py-1 z-50"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {moreCategories.map((cat) => (
                    <Link
                      key={cat.href}
                      to={cat.href}
                      onClick={() => setMoreOpen(false)}
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{
                        color: isCategoryActive(cat.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = isCategoryActive(cat.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)'; }}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={servicesRef}>
            <button
              onClick={() => { setServicesOpen(!servicesOpen); setMoreOpen(false); }}
              className="flex items-center gap-1 px-3 py-2 text-sm uppercase tracking-[0.05em] transition-colors whitespace-nowrap"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              СЕРВИСЫ <ChevronDown size={14} className={`transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-56 py-1 z-50"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {serviceLinks.map((svc) => (
                    <Link
                      key={svc.href}
                      to={svc.href}
                      onClick={() => setServicesOpen(false)}
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{
                        color: isServiceActive(svc.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = isServiceActive(svc.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)'; }}
                    >
                      {svc.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <AnimatePresence>
            {searchOpen ? (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSearch}
                className="hidden sm:flex items-center overflow-hidden"
              >
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Найти на Сахалине..."
                  className="w-full h-9 px-3 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--accent-ocean)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    boxShadow: '0 0 0 1px var(--accent-ocean-20)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                  className="ml-2 p-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X size={16} />
                </button>
              </motion.form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex p-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Поиск"
              >
                <Search size={18} />
              </button>
            )}
          </AnimatePresence>

          <button
            onClick={() => navigate('/search')}
            className="sm:hidden p-2"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Поиск"
          >
            <Search size={18} />
          </button>

          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Тема"
            >
              {themeIcon}
            </button>
            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-40 py-1 z-50"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <ThemeSwitcher onSelect={() => setShowThemeMenu(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/account"
            className="p-2 transition-colors"
            style={{
              color: location.pathname.startsWith('/account') || location.pathname === '/login'
                ? 'var(--accent-ocean)'
                : 'var(--text-secondary)',
            }}
            aria-label="Профиль"
          >
            <User size={18} />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 ml-1"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-16 left-0 right-0 overflow-hidden"
            style={{
              backgroundColor: 'rgba(10, 15, 20, 0.95)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="mb-2">
                <p className="px-3 py-1 text-xs uppercase tracking-wider" style={{ color: 'var(--accent-ocean)', fontFamily: 'var(--font-mono)' }}>Новости</p>
                {[...mainCategories, ...moreCategories].map((section) => (
                  <Link
                    key={section.href}
                    to={section.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm uppercase tracking-[0.05em]"
                    style={{
                      color: isCategoryActive(section.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                    }}
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-[var(--border-color)] pt-2 mb-2">
                <p className="px-3 py-1 text-xs uppercase tracking-wider" style={{ color: 'var(--accent-ocean)', fontFamily: 'var(--font-mono)' }}>Сервисы</p>
                {serviceLinks.map((svc) => (
                  <Link
                    key={svc.href}
                    to={svc.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm"
                    style={{
                      color: isServiceActive(svc.href) ? 'var(--accent-ocean)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {svc.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
