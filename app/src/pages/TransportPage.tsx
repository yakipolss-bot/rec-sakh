import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Bus, Plane, Ship, Route, Loader2 } from 'lucide-react';
import apiClient from '../services/api-client';

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
}

interface Ferry {
  id: string; route: string; vesselName?: string;
  departurePort?: string; arrivalPort?: string;
  departureTime: string; arrivalTime: string;
  status: string;
}

interface Road {
  id: string; roadName: string; section?: string;
  status: string; conditionDescription?: string; lastUpdated: string;
}

interface ScheduleItem {
  id: string; type: string; routeName: string;
  city?: string; stops: string[];   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedule: Record<string, any>;
}

const STATUS_COLORS: Record<string, string> = {
  arrived: '#34D399', boarding: 'var(--accent-ocean)', scheduled: 'var(--text-muted)',
  delayed: 'var(--accent-sunset)', cancelled: '#EF4444', 'on-time': '#34D399',
};

const STATUS_LABELS: Record<string, string> = {
  arrived: 'Прибыл/Вылетел', boarding: 'Посадка', scheduled: 'Ожидается',
  delayed: 'Задержан', cancelled: 'Отменён', 'on-time': ' По расписанию',
};

export default function TransportPage() {
  const [tab, setTab] = useState<TransportTab>('schedule');
  const [flightTab, setFlightTab] = useState<'arrival' | 'departure'>('arrival');
  const [flights, setFlights] = useState<Flight[]>([]);
  const [ferries, setFerries] = useState<Ferry[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [flightsRes, ferriesRes, roadsRes, schedulesRes] = await Promise.allSettled([
        apiClient.get('/transport/flights'),
        apiClient.get('/transport/ferry'),
        apiClient.get('/transport/roads'),
        apiClient.get('/transport/schedule'),
      ]);

      if (flightsRes.status === 'fulfilled') {
        const d = flightsRes.value.data;
        setFlights(d?.data || d || []);
      }
      if (ferriesRes.status === 'fulfilled') {
        const d = ferriesRes.value.data;
        setFerries(d?.data || d || []);
      }
      if (roadsRes.status === 'fulfilled') {
        const d = roadsRes.value.data;
        setRoads(d?.data || d || []);
      }
      if (schedulesRes.status === 'fulfilled') {
        const d = schedulesRes.value.data;
        setSchedules(d?.data || d || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 60000);
    return () => clearInterval(id);
  }, []);

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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[var(--accent-ocean)]" />
          </div>
        ) : (
          <>
            {tab === 'schedule' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sakh-card overflow-hidden"
              >
                {schedules.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bus size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Нет данных о расписаниях</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border-color)]">
                          <th className="sakh-caption text-left p-4">Маршрут</th>
                          <th className="sakh-caption text-left p-4">Тип</th>
                          <th className="sakh-caption text-left p-4">Город</th>
                          <th className="sakh-caption text-left p-4">Остановки</th>
                          <th className="sakh-caption text-left p-4">Расписание</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map((item) => (
                          <tr key={item.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors">
                            <td className="p-4 text-sm text-[var(--text-primary)]">{item.routeName}</td>
                            <td className="p-4">
                              <span className="sakh-tag sakh-tag--muted">{item.type === 'bus' ? 'Автобус' : 'Поезд'}</span>
                            </td>
                            <td className="p-4 text-sm text-[var(--text-secondary)]">{item.city || '—'}</td>
                            <td className="p-4 text-sm text-[var(--text-secondary)]">
                              <span className="truncate block max-w-[200px]" title={item.stops?.join(' → ') || ''}>
                                {item.stops?.slice(0, 3).join(' → ') || '—'}
                                {item.stops?.length > 3 ? '...' : ''}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-[var(--text-secondary)]">
                              {item.schedule?.departure
                                ? `${item.schedule.departure} — ${item.schedule.arrival}`
                                : item.schedule?.weekday || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'airport' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setFlightTab('arrival')}
                    className={flightTab === 'arrival' ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
                  >Прилёт</button>
                  <button
                    onClick={() => setFlightTab('departure')}
                    className={flightTab === 'departure' ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
                  >Вылет</button>
                </div>

                <div className="sakh-card overflow-hidden">
                  {flights.length === 0 ? (
                    <div className="p-8 text-center">
                      <Plane size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
                      <p className="text-sm text-[var(--text-secondary)]">Нет данных о рейсах</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[var(--border-color)]">
                            <th className="sakh-caption text-left p-4">Рейс</th>
                            <th className="sakh-caption text-left p-4">Авиакомпания</th>
                            <th className="sakh-caption text-left p-4">Направление</th>
                            <th className="sakh-caption text-left p-4">Время</th>
                            <th className="sakh-caption text-left p-4">Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flights
                            .filter((f) => flightTab === 'arrival' ? isArrival(f) : isDeparture(f))
                            .map((f) => (
                              <tr key={f.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors">
                                <td className="p-4 font-mono text-sm font-medium text-[var(--accent-ocean)]">{f.flightNumber}</td>
                                <td className="p-4 text-sm text-[var(--text-secondary)]">{f.airline || '—'}</td>
                                <td className="p-4 text-sm text-[var(--text-primary)]">
                                  {flightTab === 'arrival' ? f.departureCity : f.arrivalCity}
                                </td>
                                <td className="p-4 font-mono text-sm text-[var(--text-primary)]">
                                  {formatTime(f.departureTime)}
                                </td>
                                <td className="p-4">
                                  <span className="sakh-meta font-medium" style={statusStyle(f.status)}>
                                    {statusLabel(f.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === 'ferry' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {ferries.length === 0 ? (
                  <div className="sakh-card p-8 text-center">
                    <Ship size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Нет данных о паромах</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ferries.map((ferry) => (
                      <div key={ferry.id} className="sakh-card p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Ship size={24} className="text-[var(--accent-ocean)]" />
                          <div>
                            <h3 className="sakh-title">{ferry.vesselName || ferry.route}</h3>
                            <span className="sakh-meta text-xs">{ferry.route}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="sakh-meta">Статус</span>
                            <span className="sakh-meta font-medium" style={statusStyle(ferry.status)}>
                              {statusLabel(ferry.status)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="sakh-meta">Откуда</span>
                            <span className="sakh-meta text-[var(--text-primary)]">{ferry.departurePort || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="sakh-meta">Куда</span>
                            <span className="sakh-meta text-[var(--text-primary)]">{ferry.arrivalPort || '—'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="sakh-meta">Отправление</span>
                            <span className="sakh-meta text-[var(--text-primary)]">{formatDate(ferry.departureTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="sakh-meta">Прибытие</span>
                            <span className="sakh-meta text-[var(--text-primary)]">{formatDate(ferry.arrivalTime)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'roads' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {roads.length === 0 ? (
                  <div className="sakh-card p-8 text-center">
                    <Route size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
                    <p className="text-sm text-[var(--text-secondary)]">Нет данных о дорогах</p>
                  </div>
                ) : (
                  roads.map((road) => {
                    let tagStyle = { backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.3)' };
                    let label = 'Открыто';
                    if (road.status === 'caution') {
                      tagStyle = { backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#FBBF24', borderColor: 'rgba(251, 191, 36, 0.3)' };
                      label = 'С ограничениями';
                    } else if (road.status === 'closed') {
                      tagStyle = { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' };
                      label = 'Закрыт';
                    }
                    return (
                      <div key={road.id} className="sakh-card p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="sakh-title mb-1">{road.roadName}{road.section ? ` — ${road.section}` : ''}</h3>
                            {road.conditionDescription && (
                              <span className="sakh-meta">{road.conditionDescription}</span>
                            )}
                          </div>
                          <span className="sakh-tag" style={tagStyle}>{label}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
