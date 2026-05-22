import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const pollData = {
  question: 'Как вы оцениваете работу общественного транспорта в Южно-Сахалинске?',
  options: [
    { id: 'a', label: 'Отлично' },
    { id: 'b', label: 'Хорошо' },
    { id: 'c', label: 'Удовлетворительно' },
    { id: 'd', label: 'Плохо' },
  ],
};

const initialResults: Record<string, number> = {
  a: 35, b: 28, c: 22, d: 15,
};

export default function PollSection() {
  const [pollVoted, setPollVoted] = useState(false);
  const [pollSelected, setPollSelected] = useState<string | null>(null);
  const [pollResults] = useState<Record<string, number>>(initialResults);

  const totalVotes = Object.values(pollResults).reduce((a, b) => a + b, 0);

  const handleVote = () => {
    if (!pollSelected) return;
    setPollVoted(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="mb-12"
      aria-label="Опрос дня"
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-[var(--accent-ocean)]" />
        <h2 className="sakh-heading">Опрос дня</h2>
      </div>
      <div className="sakh-card p-6">
        <h3 className="sakh-title mb-6">{pollData.question}</h3>
        <div className="space-y-3">
          {pollData.options.map((option) => {
            const percentage = pollVoted ? Math.round((pollResults[option.id] / totalVotes) * 100) : 0;
            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 ${
                  pollVoted ? '' : 'hover:bg-[var(--accent-ocean-20)]'
                } ${pollSelected === option.id && !pollVoted ? 'bg-[var(--accent-ocean-20)]' : ''} ${
                  pollVoted ? 'border-l-[3px] border-[var(--accent-ocean)]' : 'border-l-[3px] border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="poll"
                  value={option.id}
                  checked={pollSelected === option.id}
                  onChange={() => setPollSelected(option.id)}
                  disabled={pollVoted}
                  className="sakh-radio"
                  aria-label={option.label}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{option.label}</span>
                    {pollVoted && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-sm font-mono font-medium text-[var(--accent-ocean)]"
                      >
                        {percentage}%
                      </motion.span>
                    )}
                  </div>
                  {pollVoted && (
                    <div className="mt-2 sakh-progress">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="sakh-progress__bar"
                      />
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        {!pollVoted && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleVote}
            disabled={!pollSelected}
            className="sakh-btn sakh-btn--primary sakh-btn--md mt-6"
            aria-label="Проголосовать"
          >
            Проголосовать
          </motion.button>
        )}
        {pollVoted && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="sakh-meta mt-4"
          >
            Всего голосов: {totalVotes}
          </motion.p>
        )}
      </div>
    </motion.section>
  );
}
