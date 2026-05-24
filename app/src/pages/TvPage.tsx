import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Tv } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const schedule = [
  { time: '06:00', channel: 'Первый канал', show: 'Утро России. Суббота' },
  { time: '06:00', channel: 'Россия 1', show: 'Вести' },
  { time: '06:00', channel: 'НТВ', show: 'Утро. Самое лучшее' },
  { time: '08:00', channel: 'Первый канал', show: 'Новости' },
  { time: '08:20', channel: 'Первый канал', show: 'Играй, гармонь любимая!' },
  { time: '08:45', channel: 'Первый канал', show: 'Слово пастыря' },
  { time: '09:00', channel: 'Россия 1', show: 'Вести' },
  { time: '10:00', channel: 'Первый канал', show: 'Новости' },
  { time: '10:15', channel: 'Первый канал', show: 'Жить здорово!' },
  { time: '11:00', channel: 'Россия 1', show: 'Пятеро на одного' },
  { time: '12:00', channel: 'Первый канал', show: 'Новости' },
  { time: '12:15', channel: 'Первый канал', show: 'Идеальный ремонт' },
  { time: '13:00', channel: 'НТВ', show: 'Участок' },
  { time: '14:00', channel: 'Россия 1', show: 'Вести' },
  { time: '14:30', channel: 'Россия 1', show: '60 минут' },
  { time: '16:00', channel: 'Первый канал', show: 'Новости' },
  { time: '16:15', channel: 'Первый канал', show: 'Давай поженимся!' },
  { time: '17:00', channel: 'Россия 1', show: 'Вести' },
  { time: '18:00', channel: 'НТВ', show: 'ДНК' },
  { time: '19:00', channel: 'Первый канал', show: 'Новости' },
  { time: '21:00', channel: 'Первый канал', show: 'Время' },
  { time: '21:20', channel: 'Первый канал', show: 'Художественный фильм' },
];

const CHANNEL_COLORS: Record<string, string> = {
  'Первый канал': 'var(--accent-ocean)',
  'Россия 1': 'var(--accent-sunset)',
  'НТВ': '#A78BFA',
};

export default function TvPage() {
  const channels = [...new Set(schedule.map(s => s.channel))];

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Телепрограмма | Сахалин" description="Телепрограмма на сегодня в Южно-Сахалинске." />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">ТВ-программа</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Tv size={24} className="text-[var(--accent-ocean)]" />
            <h1 className="sakh-heading">ТВ-программа</h1>
          </div>
          <p className="sakh-body">Программа передач на сегодня, 16 мая 2026</p>
        </motion.div>

        <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar">
          {channels.map(ch => (
            <div
              key={ch}
              className="sakh-tag"
              style={{
                backgroundColor: `${CHANNEL_COLORS[ch]}20`,
                color: CHANNEL_COLORS[ch],
                borderColor: `${CHANNEL_COLORS[ch]}40`,
              }}
            >
              <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: CHANNEL_COLORS[ch] }} />
              {ch}
            </div>
          ))}
        </div>

        <div className="sakh-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="sakh-caption text-left p-4 w-24">Время</th>
                  <th className="sakh-caption text-left p-4 w-40">Канал</th>
                  <th className="sakh-caption text-left p-4">Передача</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    <td className="p-4 font-mono text-sm font-medium text-[var(--accent-ocean)]">{item.time}</td>
                    <td className="p-4">
                      <span className="text-sm font-medium" style={{ color: CHANNEL_COLORS[item.channel] || 'var(--text-primary)' }}>
                        {item.channel}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-primary)]">{item.show}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
