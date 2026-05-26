import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Tv, Loader2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

interface TvEpisode {
  id: number;
  airdate: string;
  airtime: string;
  name: string;
  show: {
    name: string;
    network?: { name: string; country: { name: string } };
    webChannel?: { name: string };
  };
}

const CHANNEL_COLORS: Record<string, string> = {
  'Первый канал': '#0072C6',
  'Россия 1': '#E53935',
  'НТВ': '#9B59B6',
  'ТНТ': '#E91E63',
  'СТС': '#FF9800',
  'Пятый канал': '#4CAF50',
  'Пятница': '#FF5722',
  'РЕН ТВ': '#2196F3',
  'ТВ-3': '#00BCD4',
  'Смотрим': '#607D8B',
};

function getChannelName(episode: TvEpisode): string {
  return episode.show.network?.name || episode.show.webChannel?.name || 'ТВ';
}

export default function TvPage() {
  const [schedule, setSchedule] = useState<TvEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);

    async function fetchSchedule() {
      try {
        const res = await fetch(`https://api.tvmaze.com/schedule?country=RU&date=${today}`);
        const data: TvEpisode[] = await res.json();
        if (!cancelled) setSchedule(data);
      } catch {
        if (!cancelled) setSchedule([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSchedule();
    return () => { cancelled = true; };
  }, []);

  const channels = [...new Set(schedule.map(getChannelName))];

  const todayStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

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
          <p className="sakh-body">Программа передач на сегодня, {todayStr}</p>
        </motion.div>

        <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar">
          {channels.map(ch => (
            <div
              key={ch}
              className="sakh-tag"
              style={{
                backgroundColor: `${CHANNEL_COLORS[ch] || '#666'}20`,
                color: CHANNEL_COLORS[ch] || '#666',
                borderColor: `${CHANNEL_COLORS[ch] || '#666'}40`,
              }}
            >
              <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: CHANNEL_COLORS[ch] || '#666' }} />
              {ch}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-[var(--accent-ocean)]" />
          </div>
        ) : schedule.length === 0 ? (
          <div className="sakh-card p-6 text-center">
            <p className="sakh-meta">Программа передач временно недоступна</p>
          </div>
        ) : (
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
                  {schedule.map((item, i) => {
                    const channel = getChannelName(item);
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors"
                      >
                        <td className="p-4 font-mono text-sm font-medium text-[var(--accent-ocean)]">{item.airtime}</td>
                        <td className="p-4">
                          <span className="text-sm font-medium" style={{ color: CHANNEL_COLORS[channel] || 'var(--text-primary)' }}>
                            {channel}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-[var(--text-primary)]">{item.show.name}{item.name ? ` — ${item.name}` : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
