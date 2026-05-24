import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid3X3, ChevronRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

interface CrosswordEntry {
  id: string;
  title: string;
  date: string;
  difficulty: string;
  words: number;
}

const mockCrosswords: CrosswordEntry[] = [
  { id: 'cw1', title: 'Кроссворд №1: Сахалинский', date: '16 мая 2026', difficulty: 'Средний', words: 30 },
  { id: 'cw2', title: 'Кроссворд №2: Городской', date: '15 мая 2026', difficulty: 'Лёгкий', words: 20 },
  { id: 'cw3', title: 'Кроссворд №3: Эрудит', date: '14 мая 2026', difficulty: 'Сложный', words: 40 },
  { id: 'cw4', title: 'Кроссворд №4: Островной', date: '13 мая 2026', difficulty: 'Средний', words: 25 },
  { id: 'cw5', title: 'Кроссворд №5: Вечерний', date: '12 мая 2026', difficulty: 'Лёгкий', words: 15 },
  { id: 'cw6', title: 'Кроссворд №6: Тематический', date: '11 мая 2026', difficulty: 'Средний', words: 30 },
];

const difficultyColors: Record<string, string> = {
  'Лёгкий': '#34D399',
  'Средний': 'var(--accent-ocean)',
  'Сложный': 'var(--accent-sunset)',
};

export default function CrosswordsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Кроссворды | Сахалин" noIndex />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Кроссворды</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Grid3X3 size={24} className="text-[var(--accent-ocean)]" />
            <h1 className="sakh-heading">Кроссворды</h1>
          </div>
          <p className="sakh-body">Архив кроссвордов</p>
        </motion.div>

        {selected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sakh-card p-6"
          >
            <button
              onClick={() => setSelected(null)}
              className="sakh-btn sakh-btn--ghost sakh-btn--sm mb-4"
            >
              ← К списку
            </button>
            <div className="sakh-empty">
              <Grid3X3 size={48} className="sakh-empty__icon text-[var(--accent-ocean)]" />
              <h3 className="sakh-empty__title">Редактор кроссвордов</h3>
              <p className="sakh-empty__description">Функция в разработке. Скоро вы сможете разгадывать кроссворды онлайн.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {mockCrosswords.map((cw, i) => (
              <motion.div
                key={cw.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <button
                  onClick={() => setSelected(cw.id)}
                  className="sakh-card p-4 w-full text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="sakh-title mb-1 group-hover:text-[var(--accent-ocean)] transition-colors">{cw.title}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="sakh-meta">{cw.date}</span>
                        <span className="sakh-meta" style={{ color: difficultyColors[cw.difficulty] }}>{cw.difficulty}</span>
                        <span className="sakh-meta">{cw.words} слов</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-[var(--accent-ocean)] transition-colors shrink-0" />
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
