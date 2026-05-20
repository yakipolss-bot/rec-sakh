import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';

const VIEW_OPTIONS = [
  { value: 'list', label: 'Список' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
];

const CATEGORY_OPTIONS = [
  { value: 'cinema', label: 'Кино' },
  { value: 'theatre', label: 'Театр' },
  { value: 'concert', label: 'Концерты' },
  { value: 'exhibition', label: 'Выставки' },
  { value: 'sport', label: 'Спорт' },
  { value: 'festival', label: 'Фестивали' },
];

export default function EventsPage() {
  const [view, setView] = useState('list');
  const [category, setCategory] = useState<string | null>(null);

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Афиша</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Афиша</h1>
          <p className="sakh-body">События Сахалина: концерты, спектакли, выставки и спорт</p>
        </motion.div>

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {VIEW_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setView(opt.value)}
                  className={view === opt.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
                >
                  {opt.value === 'list' && <CalendarDays size={12} className="inline mr-1" />}
                  {opt.value === 'week' && <CalendarDays size={12} className="inline mr-1" />}
                  {opt.value === 'month' && <CalendarDays size={12} className="inline mr-1" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <FilterBar
            options={CATEGORY_OPTIONS}
            selected={category}
            onChange={setCategory}
          />
        </div>

        <div className="col-span-full">
          <EmptyState
            title="Модуль событий скоро появится"
            description="Календарь событий Сахалина уже в разработке. Скоро здесь появятся концерты, спектакли, выставки и спортивные мероприятия."
            action={
              <Link to="/" className="sakh-btn sakh-btn--primary sakh-btn--md">
                На главную
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
}
