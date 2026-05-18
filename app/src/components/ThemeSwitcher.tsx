import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Focus } from 'lucide-react';
import type { ThemeMode } from '@/types';

const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'morning', label: 'Утро', icon: <Sun size={14} /> },
  { value: 'day', label: 'День', icon: <Sun size={14} /> },
  { value: 'evening', label: 'Вечер', icon: <span className="sakh-meta" style={{ fontSize: 10 }}>🌙</span> },
  { value: 'focus', label: 'Фокус', icon: <Focus size={14} /> },
  { value: 'night', label: 'Ночь', icon: <Moon size={14} /> },
];

interface ThemeSwitcherProps {
  className?: string;
  onSelect?: () => void;
}

export default function ThemeSwitcher({ className = '', onSelect }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={className}>
      {themeOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => { setTheme(opt.value); onSelect?.(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 ${
            theme === opt.value ? 'sakh-meta--accent' : ''
          }`}
          style={{
            color: theme === opt.value ? 'var(--accent-ocean)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
          role="menuitem"
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
