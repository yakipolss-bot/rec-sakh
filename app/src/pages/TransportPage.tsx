import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bus, Plane, Ship, Route, Loader2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api-client';
import SEOHead from '@/components/SEOHead';

type TransportTab = 'schedule' | 'airport' | 'ferry' | 'roads';

const TABS: { value: TransportTab; label: string; icon: React.ReactNode }[] = [
  { value: 'schedule', label: 'Расписания', icon: <Bus size={14} /> },
  { value: 'airport', label: 'Аэропорт', icon: <Plane size={14} /> },
  { value: 'ferry', label: 'Паром', icon: <Ship size={14} /> },
  { value: 'roads', label: 'Дороги', icon: <Route size={14} /> },
];

interface Flight {
  id: string; flightNumber: string; airline?: string;
  departureCity?: string; arrivalCity?: string;
  departureTime: string; arrivalTime: string;
  status: string; terminal?: string; gate?: string;
  date: string;
}

interface Ferry {
  id: string; route: string; vesselName?: string;
  departurePort?: string; arrivalPort?: string;
  departureTime: string; arrivalTime: string;
  status: string; date: string;
}

interface Road {
  id: string; roadName: string; section?: string;
  status: string; conditionDescription?: string; lastUpdated: string;
}

interface ScheduleItem {
  id: string; type: string; routeName: string;
  city?: string; stops: string[];
  schedule: Record<string, any>;
}

type DayFilter = 'all' | 'weekday' | 'weekend';
type DatePreset = 'today' | 'tomorrow' | 'custom';

const STATUS_COLORS: Record<string, string> = {
  departed: '#F59E0B', arrived: '#34D399', boarding: 'var(--accent-ocean)',
  scheduled: 'var(--text-muted)', delayed: 'var(--accent-sunset)',
  cancelled: '#EF4444', 'on-time': '#34D399',
};

const STATUS_LABELS: Record<string, string> = {
  departed: 'Вылетел', arrived: 'Прибыл', boarding: 'Посадка',
  scheduled: 'Ожидается', delayed: 'Задержан', cancelled: 'Отменён',
  'on-time': 'По расписанию',
};

const DAY_LABELS: Record<DayFilter, string> = {
  all: 'Все дни',
  weekday: 'Будни',
  weekend: 'Выходные',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

const tabContentVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function TransportPage() {
  const [tab, setTab] = useState<TransportTab>('schedule');
  const [flightTab, setFlightTab] = useState<'arrival' | 'departure'>('arrival');
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<'all' | 'bus' | 'train'>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const [ferryDatePreset, setFerryDatePreset] = useState<DatePreset>('today');

  const flightsQuery = useQuery({
    queryKey: ['transport', 'flights'],
    queryFn: () => apiClient.get('/transport/flights').then(res => res.data?.data || res.data || []),
    refetchInterval: 60000,
  });

  const ferriesQuery = useQuery({
    queryKey: ['transport', 'ferry'],
    queryFn: () => apiClient.get('/transport/ferry').then(res => res.data?.data || res.data || []),
    refetchInterval: 60000,
  });

  const roadsQuery = useQuery({
    queryKey: ['transport', 'roads'],
    queryFn: () => apiClient.get('/transport/roads').then(res => res.data?.data || res.data || []),
    refetchInterval: 60000,
  });

  const schedulesQuery = useQuery({
    queryKey: ['transport', 'schedule'],
    queryFn: () => apiClient.get('/transport/schedule').then(res => res.data?.data || res.data || []),
    refetchInterval: 60000,
  });

  const flights = flightsQuery.data ?? [];
  const ferries = ferriesQuery.data ?? [];
  const roads = roadsQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const isLoading = flightsQuery.isLoading || ferriesQuery.isLoading || roadsQuery.isLoading || schedulesQuery.isLoading;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const statusStyle = (status: string) => ({
    color: STATUS_COLORS[status] || 'var(--text-muted)',
  });

  const statusLabel = (status: string) => STATUS_LABELS[status] || status;

  const isArrival = (f: Flight) => f.arrivalCity?.includes('UUS') || f.arrivalCity?.includes('Южно-Сахалинск');
  const isDeparture = (f: Flight) => f.departureCity?.includes('UUS') || f.departureCity?.includes('Южно-Сахалинск');

  const filteredSchedules = useMemo(() => {
    let result = schedules;
    if (scheduleTypeFilter !== 'all') {
      result = result.filter(s => s.type === scheduleTypeFilter);
    }
    if (dayFilter !== 'all') {
      result = result.filter(s => {
        const sch = s.schedule || {};
        if (sch.days === 'ежедневно') return true;
        if (dayFilter === 'weekday') return !!sch.weekday;
        if (dayFilter === 'weekend') return !!sch.weekend;
        return true;
      });
    }
    return result;
  }, [schedules, dayFilter, scheduleTypeFilter]);

  const filteredFlights = useMemo(() => {
    let result = flights.filter(f => flightTab === 'arrival' ? isArrival(f) : isDeparture(f));
    const targetDate = datePreset === 'today' ? todayStr : datePreset === 'tomorrow' ? tomorrowStr : customDate;
    if (targetDate) {
      result = result.filter(f => f.date === targetDate);
    }
    return result;
  }, [flights, flightTab, datePreset, customDate, todayStr, tomorrowStr]);

  const filteredFerries = useMemo(() => {
    let result = ferries;
    const targetDate = ferryDatePreset === 'today' ? todayStr : ferryDatePreset === 'tomorrow' ? tomorrowStr : customDate;
    if (targetDate) {
      result = result.filter(f => f.date === targetDate);
    }
    return result;
  }, [ferries, ferryDatePreset, customDate, todayStr, tomorrowStr]);

  const activeTab = (v: TransportTab) => tab === v;

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Транспорт | Сахалин" description="Расписание самолётов и паромов Сахалина. Онлайн табло аэропорта." />
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
              className={`sakh-tabs__item ${activeTab(t.value) ? 'sakh-tabs__item--active' : ''}`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-[var(--accent-ocean)]" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {tab === 'schedule' && (
                <div>
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex gap-1.5">
                      {(['all', 'bus', 'train'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setScheduleTypeFilter(t)}
                          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                            scheduleTypeFilter === t
                              ? 'bg-[var(--accent-ocean)] text-white'
                              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                          }`}
                        >
                          {t === 'all' ? 'Все' : t === 'bus' ? 'Автобусы' : 'Поезда'}
                        </button>
                      ))}
                    </div>
                    <div className="w-px h-5 bg-[var(--border-color)]" />
                    <div className="flex gap-1.5">
                      {(['all', 'weekday', 'weekend'] as const).map(d => (
                        <button
                          key={d}
                          onClick={() => setDayFilter(d)}
                          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                            dayFilter === d
                              ? 'bg-[var(--accent-ocean)] text-white'
                              : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                          }`}
                        >
                          {DAY_LABELS[d]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredSchedules.length === 0 ? (
                    <div className="sakh-card p-8 text-center">
                      <Bus size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
                      <p className="text-sm text-[var(--text-secondary)]">Нет данных о расписаниях</p>
                    </div>
                  ) : (
                    <div className="sakh-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: 600 }}>
                          <thead>
                            <tr className="border-b border-[var(--border-color)]">
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[20%]">Маршрут</th>
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[10%]">Тип</th>
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[12%]">Город</th>
                              <th className="sakh-caption text-left px-3 py-2.5 w-[30%]">Остановки</th>
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[28%]">Расписание</th>
                            </tr>
                          </thead>
                          <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                            {filteredSchedules.map((item) => {
                              const sch = item.schedule || {};
                              const scheduleText = sch.departure
                                ? `${sch.departure} – ${sch.arrival}`
                                : dayFilter === 'weekend' && sch.weekend
                                  ? sch.weekend
                                  : sch.weekday || sch.weekend || '—';
                              const intervalText = sch.interval ? `· кажд. ${sch.interval}` : '';
                              return (
                                <motion.tr
                                  key={item.id}
                                  variants={rowVariants}
                                  className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors"
                                >
                                  <td className="px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] whitespace-nowrap">{item.routeName}</td>
                                  <td className="px-3 py-2.5">
                                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border"
                                      style={{
                                        color: item.type === 'bus' ? 'var(--accent-ocean)' : 'var(--accent-sunset)',
                                        borderColor: item.type === 'bus' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(251, 191, 36, 0.3)',
                                        backgroundColor: item.type === 'bus' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                                      }}
                                    >
                                      {item.type === 'bus' ? 'Автобус' : 'Поезд'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-sm text-[var(--text-secondary)] whitespace-nowrap">{item.city || '—'}</td>
                                  <td className="px-3 py-2.5 text-sm text-[var(--text-secondary)] max-w-[240px]">
                                    <span className="truncate block" title={item.stops?.join(' → ') || ''}>
                                      {item.stops?.slice(0, 3).join(' → ') || '—'}
                                      {item.stops?.length > 3 ? <span className="text-[var(--text-muted)]"> +{item.stops.length - 3}</span> : ''}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-sm text-[var(--text-primary)] whitespace-nowrap">
                                    <span className="font-medium">{scheduleText}</span>
                                    {intervalText && (
                                      <span className="ml-1.5 text-[var(--text-muted)] text-xs">{intervalText}</span>
                                    )}
                                    {sch.weekday && sch.weekend && dayFilter === 'all' && (
                                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
                                        Будни: {sch.weekday} · Вых: {sch.weekend}
                                      </div>
                                    )}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </motion.tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'airport' && (
                <div>
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setFlightTab('arrival')}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                          flightTab === 'arrival'
                            ? 'bg-[var(--accent-ocean)] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                        }`}
                      >Прилёт</button>
                      <button
                        onClick={() => setFlightTab('departure')}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                          flightTab === 'departure'
                            ? 'bg-[var(--accent-ocean)] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                        }`}
                      >Вылет</button>
                    </div>
                    <div className="w-px h-5 bg-[var(--border-color)]" />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setDatePreset('today'); setCustomDate(''); }}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                          datePreset === 'today'
                            ? 'bg-[var(--accent-ocean)] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                        }`}
                      >Сегодня</button>
                      <button
                        onClick={() => { setDatePreset('tomorrow'); setCustomDate(''); }}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                          datePreset === 'tomorrow'
                            ? 'bg-[var(--accent-ocean)] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                        }`}
                      >Завтра</button>
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => { setCustomDate(e.target.value); setDatePreset('custom'); }}
                        className="text-xs font-mono px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-secondary)] outline-none focus:border-[var(--accent-ocean)] transition-colors cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                      />
                      <CalendarDays size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>

                  <div className="sakh-card overflow-hidden">
                    {filteredFlights.length === 0 ? (
                      <div className="p-8 text-center">
                        <Plane size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
                        <p className="text-sm text-[var(--text-secondary)]">{flights.length === 0 ? 'Нет данных о рейсах' : 'Нет рейсов на выбранную дату'}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full" style={{ minWidth: 500 }}>
                          <thead>
                            <tr className="border-b border-[var(--border-color)]">
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[14%]">Рейс</th>
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[16%]">Авиакомпания</th>
                              <th className="sakh-caption text-left px-3 py-2.5 w-[30%]">Направление</th>
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[12%]">Время</th>
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[14%]">Терминал</th>
                              <th className="sakh-caption text-left px-3 py-2.5 whitespace-nowrap w-[14%]">Статус</th>
                            </tr>
                          </thead>
                          <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                            {filteredFlights.map((f) => (
                              <motion.tr
                                key={f.id}
                                variants={rowVariants}
                                className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors"
                              >
                                <td className="px-3 py-2.5 font-mono text-sm font-semibold text-[var(--accent-ocean)] whitespace-nowrap">{f.flightNumber}</td>
                                <td className="px-3 py-2.5 text-sm text-[var(--text-secondary)] whitespace-nowrap">{f.airline || '—'}</td>
                                <td className="px-3 py-2.5 text-sm text-[var(--text-primary)] truncate max-w-[200px]">
                                  {flightTab === 'arrival' ? f.departureCity : f.arrivalCity}
                                </td>
                                <td className="px-3 py-2.5 font-mono text-sm text-[var(--text-primary)] whitespace-nowrap">{formatTime(f.departureTime)}</td>
                                <td className="px-3 py-2.5 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                  {f.terminal ? `T${f.terminal}` : '—'}{f.gate ? ` / G${f.gate}` : ''}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium" style={statusStyle(f.status)}>
                                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: STATUS_COLORS[f.status] || 'var(--text-muted)' }} />
                                    {statusLabel(f.status)}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </motion.tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'ferry' && (
                <div>
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setFerryDatePreset('today'); setCustomDate(''); }}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                          ferryDatePreset === 'today'
                            ? 'bg-[var(--accent-ocean)] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                        }`}
                      >Сегодня</button>
                      <button
                        onClick={() => { setFerryDatePreset('tomorrow'); setCustomDate(''); }}
                        className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                          ferryDatePreset === 'tomorrow'
                            ? 'bg-[var(--accent-ocean)] text-white'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-ocean)]'
                        }`}
                      >Завтра</button>
                    </div>
                  </div>

                  {filteredFerries.length === 0 ? (
                    <div className="sakh-card p-8 text-center">
                      <Ship size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
                      <p className="text-sm text-[var(--text-secondary)]">{ferries.length === 0 ? 'Нет данных о паромах' : 'Нет паромов на выбранную дату'}</p>
                    </div>
                  ) : (
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                    >
                      {filteredFerries.map((ferry) => (
                        <motion.div key={ferry.id} variants={rowVariants}>
                          <div className="sakh-card p-4 h-full">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-surface)]"
                                style={{ color: 'var(--accent-ocean)' }}>
                                <Ship size={20} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{ferry.vesselName || ferry.route}</h3>
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">{ferry.route}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider">Статус</span>
                              <span className="font-mono font-medium text-right" style={statusStyle(ferry.status)}>{statusLabel(ferry.status)}</span>
                              <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider">Откуда</span>
                              <span className="text-right text-[var(--text-primary)]">{ferry.departurePort || '—'}</span>
                              <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider">Куда</span>
                              <span className="text-right text-[var(--text-primary)]">{ferry.arrivalPort || '—'}</span>
                              <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider">Отправление</span>
                              <span className="font-mono text-right text-[var(--text-primary)]">{formatDate(ferry.departureTime)}</span>
                              <span className="font-mono text-[var(--text-muted)] uppercase tracking-wider">Прибытие</span>
                              <span className="font-mono text-right text-[var(--text-primary)]">{formatDate(ferry.arrivalTime)}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {tab === 'roads' && (
                <motion.div
                  className="space-y-2"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {roads.length === 0 ? (
                    <div className="sakh-card p-8 text-center">
                      <Route size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
                      <p className="text-sm text-[var(--text-secondary)]">Нет данных о дорогах</p>
                    </div>
                  ) : (
                    roads.map((road) => {
                      let tagStyle = { backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.3)' };
                      let label = 'Открыто';
                      if (road.status === 'caution') {
                        tagStyle = { backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', borderColor: 'rgba(251, 191, 36, 0.3)' };
                        label = 'Ограничения';
                      } else if (road.status === 'closed') {
                        tagStyle = { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' };
                        label = 'Закрыт';
                      }
                      return (
                        <motion.div key={road.id} variants={rowVariants}>
                          <div className="sakh-card p-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-medium text-[var(--text-primary)]">{road.roadName}</span>
                                  <span className="text-xs font-mono text-[var(--text-muted)]">{road.section}</span>
                                </div>
                                {road.conditionDescription && (
                                  <p className="text-xs text-[var(--text-secondary)]">{road.conditionDescription}</p>
                                )}
                              </div>
                              <span className="shrink-0 inline-flex items-center px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border" style={tagStyle}>
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ backgroundColor: tagStyle.color }} />
                                {label}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
