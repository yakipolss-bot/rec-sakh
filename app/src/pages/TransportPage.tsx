import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bus, Plane, Ship, Road } from 'lucide-react';

type TransportTab = 'schedule' | 'airport' | 'ferry' | 'roads';

const TABS: { value: TransportTab; label: string; icon: React.ReactNode }[] = [
  { value: 'schedule', label: 'Расписания', icon: <Bus size={14} /> },
  { value: 'airport', label: 'Аэропорт', icon: <Plane size={14} /> },
  { value: 'ferry', label: 'Паром', icon: <Ship size={14} /> },
  { value: 'roads', label: 'Дороги', icon: <Road size={14} /> },
];

const mockSchedule = [
  { route: 'Южно-Сахалинск — Корсаков', type: 'Автобус', departure: '07:00', arrival: '08:30', status: 'По расписанию' },
  { route: 'Южно-Сахалинск — Холмск', type: 'Автобус', departure: '08:15', arrival: '10:45', status: 'По расписанию' },
  { route: 'Южно-Сахалинск — Оха', type: 'Автобус', departure: '06:00', arrival: '18:00', status: 'По расписанию' },
  { route: 'Южно-Сахалинск — Ноглики', type: 'Поезд', departure: '09:30', arrival: '20:15', status: 'По расписанию' },
  { route: 'Южно-Сахалинск — Корсаков', type: 'Автобус', departure: '10:00', arrival: '11:30', status: 'По расписанию' },
];

const mockFlights = [
  { flight: 'SU 1234', destination: 'Москва (SVO)', type: 'arrival', time: '10:30', status: 'Прибыл' },
  { flight: 'SU 5678', destination: 'Москва (SVO)', type: 'departure', time: '12:00', status: 'Идёт посадка' },
  { flight: 'S7 9012', destination: 'Новосибирск (OVB)', type: 'departure', time: '13:15', status: 'Задержан до 14:30' },
  { flight: 'HZ 3456', destination: 'Хабаровск (KHV)', type: 'arrival', time: '14:00', status: 'Ожидается' },
  { flight: 'SU 7890', destination: 'Владивосток (VVO)', type: 'departure', time: '15:30', status: 'Регистрация' },
];

const STATUS_COLORS: Record<string, string> = {
  'Прибыл': '#34D399',
  'Идёт посадка': 'var(--accent-ocean)',
  'Вылетел': '#34D399',
  'Ожидается': 'var(--text-muted)',
  'Регистрация': 'var(--accent-ocean)',
  'По расписанию': '#34D399',
};

export default function TransportPage() {
  const [tab, setTab] = useState<TransportTab>('schedule');
  const [flightTab, setFlightTab] = useState<'arrival' | 'departure'>('arrival');

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Транспорт</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Транспорт</h1>
          <p className="sakh-body">Расписания, аэропорт, паром, дороги</p>
        </motion.div>

        <div className="sakh-tabs mb-6">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`sakh-tabs__item ${tab === t.value ? 'sakh-tabs__item--active' : ''}`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {tab === 'schedule' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sakh-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="sakh-caption text-left p-4">Маршрут</th>
                    <th className="sakh-caption text-left p-4">Тип</th>
                    <th className="sakh-caption text-left p-4">Отправление</th>
                    <th className="sakh-caption text-left p-4">Прибытие</th>
                    <th className="sakh-caption text-left p-4">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSchedule.map((item, i) => (
                    <tr key={i} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="p-4 text-sm text-[var(--text-primary)]">{item.route}</td>
                      <td className="p-4">
                        <span className="sakh-tag sakh-tag--muted">{item.type}</span>
                      </td>
                      <td className="p-4 font-mono text-sm text-[var(--text-primary)]">{item.departure}</td>
                      <td className="p-4 font-mono text-sm text-[var(--text-primary)]">{item.arrival}</td>
                      <td className="p-4">
                        <span className="sakh-meta" style={{ color: STATUS_COLORS[item.status] || 'var(--text-muted)' }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === 'airport' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFlightTab('arrival')}
                className={flightTab === 'arrival' ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
              >
                Прилёт
              </button>
              <button
                onClick={() => setFlightTab('departure')}
                className={flightTab === 'departure' ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
              >
                Вылет
              </button>
            </div>

            <div className="sakh-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="sakh-caption text-left p-4">Рейс</th>
                      <th className="sakh-caption text-left p-4">Направление</th>
                      <th className="sakh-caption text-left p-4">Время</th>
                      <th className="sakh-caption text-left p-4">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockFlights.filter(f => f.type === flightTab).map((item, i) => (
                      <tr key={i} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors">
                        <td className="p-4 font-mono text-sm font-medium text-[var(--accent-ocean)]">{item.flight}</td>
                        <td className="p-4 text-sm text-[var(--text-primary)]">{item.destination}</td>
                        <td className="p-4 font-mono text-sm text-[var(--text-primary)]">{item.time}</td>
                        <td className="p-4">
                          <span className="sakh-meta font-medium" style={{ color: STATUS_COLORS[item.status] || 'var(--text-muted)' }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'ferry' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="sakh-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Ship size={24} className="text-[var(--accent-ocean)]" />
                <h3 className="sakh-title">Ванино — Холмск</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="sakh-meta">Статус</span>
                  <span className="sakh-meta text-[#34D399] font-medium">Работает по расписанию</span>
                </div>
                <div className="flex justify-between">
                  <span className="sakh-meta">Отправление</span>
                  <span className="sakh-meta text-[var(--text-primary)]">08:00, 14:00, 20:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="sakh-meta">В пути</span>
                  <span className="sakh-meta text-[var(--text-primary)]">~4 часа</span>
                </div>
                <div className="flex justify-between">
                  <span className="sakh-meta">Ближайший рейс</span>
                  <span className="sakh-meta text-[var(--accent-ocean)]">14:00</span>
                </div>
              </div>
            </div>

            <div className="sakh-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Ship size={24} className="text-[var(--accent-ocean)]" />
                <h3 className="sakh-title">Корсаков — Вакканай</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="sakh-meta">Статус</span>
                  <span className="sakh-meta text-[var(--accent-sunset)] font-medium">Сезон закрыт</span>
                </div>
                <div className="flex justify-between">
                  <span className="sakh-meta">Следующий сезон</span>
                  <span className="sakh-meta text-[var(--text-primary)]">Июнь 2026</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'roads' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="sakh-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="sakh-title mb-1">Трасса Южно-Сахалинск — Корсаков</h3>
                  <span className="sakh-meta">15 км, состояние: хорошее</span>
                </div>
                <span className="sakh-tag" style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                  Открыто
                </span>
              </div>
            </div>

            <div className="sakh-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="sakh-title mb-1">Трасса Южно-Сахалинск — Холмск</h3>
                  <span className="sakh-meta">83 км, состояние: удовлетворительное, местами гололёд</span>
                </div>
                <span className="sakh-tag" style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                  С ограничениями
                </span>
              </div>
            </div>

            <div className="sakh-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="sakh-title mb-1">Трасса Южно-Сахалинск — Оха</h3>
                  <span className="sakh-meta">650 км, состояние: сложное, ремонтные работы на 120 км</span>
                </div>
                <span className="sakh-tag" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  Закрыт участок
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
