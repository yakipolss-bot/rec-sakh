import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Sun, Moon, Focus, User, Menu, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import ThemeSwitcher from './ThemeSwitcher';
import type { ThemeMode } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const navSections = [
  { label: 'НОВОСТИ', href: '/category/obshchestvo' },
  { label: 'ПРОИСШЕСТВИЯ', href: '/category/proisshestviya' },
  { label: 'ЭКОНОМИКА', href: '/category/ekonomika' },
  { label: 'СПОРТ', href: '/category/sport' },
  { label: 'КУЛЬТУРА', href: '/category/kultura' },
];

export default function Navbar() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
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
          {navSections.map((section) => (
            <Link
              key={section.href}
              to={section.href}
              className="relative px-3 py-2 text-sm uppercase tracking-[0.05em] transition-colors"
              style={{
                color: location.pathname.startsWith(section.href)
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              {section.label}
              {location.pathname.startsWith(section.href) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-3 right-3 h-[2px]"
                  style={{ backgroundColor: 'var(--accent-ocean)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          ))}
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
            <div className="px-4 py-4 space-y-1">
              {navSections.map((section) => (
                <Link
                  key={section.href}
                  to={section.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm uppercase tracking-[0.05em]"
                  style={{
                    color: location.pathname.startsWith(section.href)
                      ? 'var(--accent-ocean)'
                      : 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  {section.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
