import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Grid3X3, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

interface Clue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
}

interface PuzzleData {
  id: string;
  title: string;
  date: string;
  difficulty: string;
  clues: Clue[];
}

const PUZZLES: PuzzleData[] = [
  {
    id: '1',
    title: 'Животные',
    date: '2026-05-26',
    difficulty: 'Лёгкий',
    clues: [
      { number: 1, direction: 'across', clue: 'Домашний питомец, любит молоко (3 буквы)', answer: 'КОТ' },
      { number: 2, direction: 'across', clue: 'Ночная хищная птица (4 буквы)', answer: 'СОВА' },
      { number: 3, direction: 'across', clue: 'Серый хищник, воет на луну (4 буквы)', answer: 'ВОЛК' },
      { number: 4, direction: 'across', clue: 'Лесной зверь с ветвистыми рогами (4 буквы)', answer: 'ЛОСЬ' },
      { number: 5, direction: 'down', clue: 'Любимое лакомство кролика (4 буквы)', answer: 'МОРКОВЬ' },
    ],
  },
  {
    id: '2',
    title: 'География',
    date: '2026-05-25',
    difficulty: 'Средний',
    clues: [
      { number: 1, direction: 'across', clue: 'Столица России (5 букв)', answer: 'МОСКВА' },
      { number: 2, direction: 'across', clue: 'Город на Неве (6 букв)', answer: 'САНКТПЕТЕРБУРГ' },
      { number: 3, direction: 'across', clue: 'Город-герой на Волге (7 букв)', answer: 'ВОЛГОГРАД' },
      { number: 4, direction: 'down', clue: 'Крупнейший город Сибири (6 букв)', answer: 'НОВОСИБИРСК' },
    ],
  },
  {
    id: '3',
    title: 'Растения',
    date: '2026-05-24',
    difficulty: 'Сложный',
    clues: [
      { number: 1, direction: 'across', clue: 'Хвойное дерево (5 букв)', answer: 'СОСНА' },
      { number: 2, direction: 'across', clue: 'Дубовый... (3 буквы)', answer: 'ЛЕС' },
      { number: 3, direction: 'down', clue: 'Лиственное дерево с белой корой (6 букв)', answer: 'БЕРЁЗА' },
      { number: 4, direction: 'across', clue: 'Колючий кустарник с ягодами (5 букв)', answer: 'ШИПОВНИК' },
    ],
  },
];

const difficultyColors: Record<string, string> = {
  'Лёгкий': '#34D399',
  'Средний': 'var(--accent-ocean)',
  'Сложный': 'var(--accent-sunset)',
};

function PuzzleGame({ puzzle, onBack }: { puzzle: PuzzleData; onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (clueNumber: number, value: string) => {
    setAnswers(prev => ({ ...prev, [clueNumber]: value.toUpperCase() }));
    setShowResults(false);
  };

  const checkAll = () => {
    setShowResults(true);
  };

  const allCorrect = puzzle.clues.every(clue => {
    const userAnswer = answers[clue.number] || '';
    return userAnswer === clue.answer;
  });

  const someFilled = puzzle.clues.some(clue => answers[clue.number]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1 }} className="space-y-4">
      <button onClick={onBack} className="sakh-btn sakh-btn--ghost sakh-btn--sm">
        ← К списку
      </button>

      <div className="sakh-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="sakh-title">{puzzle.title}</h2>
            <p className="sakh-meta text-xs">{puzzle.date}</p>
          </div>
          <span className="sakh-tag" style={{ color: difficultyColors[puzzle.difficulty], borderColor: `${difficultyColors[puzzle.difficulty]}40` }}>
            {puzzle.difficulty}
          </span>
        </div>

        <div className="space-y-3">
          {puzzle.clues.map(clue => {
            const userAnswer = answers[clue.number] || '';
            const isCorrect = showResults && userAnswer === clue.answer;
            const isWrong = showResults && userAnswer !== '' && userAnswer !== clue.answer;
            return (
              <div key={clue.number} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-mono font-medium bg-[var(--accent-ocean-20)] text-[var(--accent-ocean)]">
                  {clue.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">
                    <span className="uppercase text-[10px] font-mono text-[var(--text-muted)] mr-1">
                      {clue.direction === 'across' ? 'Г' : 'В'}
                    </span>
                    {clue.clue}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={e => handleAnswer(clue.number, e.target.value)}
                      placeholder="..."
                      className={`sakh-input !py-1.5 !text-sm font-mono uppercase max-w-[200px] ${
                        isCorrect ? '!border-green-500/50 !bg-green-900/10' : ''
                      } ${isWrong ? '!border-red-500/50 !bg-red-900/10' : ''}`}
                      onKeyDown={e => { if (e.key === 'Enter') checkAll(); }}
                    />
                    {isCorrect && <CheckCircle2 size={16} className="text-green-400 shrink-0" />}
                    {isWrong && <XCircle size={16} className="text-red-400 shrink-0" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-color)]">
          <button onClick={checkAll} className="sakh-btn sakh-btn--primary sakh-btn--sm" disabled={!someFilled}>
            Проверить
          </button>
          {allCorrect && showResults && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              Все верно!
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function CrosswordsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = PUZZLES.find(p => p.id === selectedId);

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Кроссворды | Сахалин" noIndex />
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Кроссворды</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Grid3X3 size={24} className="text-[var(--accent-ocean)]" />
            <h1 className="sakh-heading">Кроссворды</h1>
          </div>
          <p className="sakh-body">Решайте кроссворды онлайн. Введите ответы и нажмите «Проверить».</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {selected ? (
            <PuzzleGame key={selected.id} puzzle={selected} onBack={() => setSelectedId(null)} />
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {PUZZLES.map((cw, i) => (
                <motion.div
                  key={cw.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => setSelectedId(cw.id)}
                    className="sakh-card p-4 w-full text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="sakh-title mb-1 group-hover:text-[var(--accent-ocean)]">{cw.title}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="sakh-meta">{cw.date}</span>
                          <span className="sakh-meta" style={{ color: difficultyColors[cw.difficulty] }}>{cw.difficulty}</span>
                          <span className="sakh-meta">{cw.clues.length} вопросов</span>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-[var(--text-muted)] group-hover:text-[var(--accent-ocean)] shrink-0" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
