import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Овен', date: '21 мар — 19 апр', emoji: '♈' },
  { id: 'taurus', name: 'Телец', date: '20 апр — 20 май', emoji: '♉' },
  { id: 'gemini', name: 'Близнецы', date: '21 май — 20 июн', emoji: '♊' },
  { id: 'cancer', name: 'Рак', date: '21 июн — 22 июл', emoji: '♋' },
  { id: 'leo', name: 'Лев', date: '23 июл — 22 авг', emoji: '♌' },
  { id: 'virgo', name: 'Дева', date: '23 авг — 22 сен', emoji: '♍' },
  { id: 'libra', name: 'Весы', date: '23 сен — 22 окт', emoji: '♎' },
  { id: 'scorpio', name: 'Скорпион', date: '23 окт — 21 ноя', emoji: '♏' },
  { id: 'sagittarius', name: 'Стрелец', date: '22 ноя — 21 дек', emoji: '♐' },
  { id: 'capricorn', name: 'Козерог', date: '22 дек — 19 янв', emoji: '♑' },
  { id: 'aquarius', name: 'Водолей', date: '20 янв — 18 фев', emoji: '♒' },
  { id: 'pisces', name: 'Рыбы', date: '19 фев — 20 мар', emoji: '♓' },
];

function useHoroscope(signId: string | null) {
  const [data, setData] = useState<{ horoscope: string; date: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!signId) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`https://newastro.vercel.app/${signId}`)
      .then(r => r.json())
      .then(res => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [signId]);

  return { data, loading };
}

export default function HoroscopePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const { data: horoscope, loading } = useHoroscope(selected);
  const sign = ZODIAC_SIGNS.find(s => s.id === selected);

  const todayStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Гороскоп | Сахалин" noIndex />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Гороскоп</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Гороскоп на сегодня</h1>
          <p className="sakh-body">{todayStr}</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {ZODIAC_SIGNS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id === selected ? null : s.id)}
              className={`sakh-card p-4 text-center transition-all ${
                selected === s.id ? 'border-[var(--accent-ocean)]' : ''
              }`}
            >
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{s.name}</div>
              <div className="sakh-caption text-[10px] mt-1">{s.date}</div>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {sign && (
            <motion.div
              key={sign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="sakh-card p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{sign.emoji}</span>
                <div>
                  <h2 className="sakh-title">{sign.name}</h2>
                  <p className="sakh-caption">{sign.date}</p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 size={16} className="animate-spin text-[var(--accent-ocean)]" />
                  <span className="sakh-meta">Загрузка гороскопа...</span>
                </div>
              ) : horoscope ? (
                <p className="sakh-body leading-relaxed">{horoscope.horoscope}</p>
              ) : (
                <p className="sakh-meta">Не удалось загрузить гороскоп</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
