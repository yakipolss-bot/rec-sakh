import { motion } from 'framer-motion';
import {
  Activity, Clock, AlertTriangle, Users as UsersIcon,
  ArrowUpRight, Cpu, Server as ServerIcon,
} from 'lucide-react';
import { adminStats, recentActions, alerts } from '@/data/adminMock';

const statCards = [
  { label: 'Uptime', value: adminStats.uptime, icon: Clock, color: 'var(--accent-ocean)' },
  { label: 'Нагрузка CPU', value: `${adminStats.cpuLoad}%`, icon: Cpu, color: adminStats.cpuLoad > 80 ? 'var(--accent-sunset)' : 'var(--accent-ocean)' },
  { label: 'Ошибки 500', value: String(adminStats.errors500), icon: AlertTriangle, color: adminStats.errors500 > 0 ? 'var(--accent-sunset)' : 'var(--accent-ocean)' },
  { label: 'Отклик API', value: `${adminStats.apiResponseTime}ms`, icon: ServerIcon, color: 'var(--accent-ocean)' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Дашборд</h1>
        <span className="sakh-meta">Обновлено: только что</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="sakh-meta">{card.label}</span>
                <Icon size={18} style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">{card.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight size={12} className="text-[var(--accent-ocean)]" />
                <span className="sakh-meta text-[var(--accent-ocean)]">+2.4%</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="sakh-card p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="sakh-caption text-[var(--text-primary)]">Пользователи онлайн</h2>
            <UsersIcon size={16} className="text-[var(--accent-ocean)]" />
          </div>
          <p className="text-3xl font-mono font-bold text-[var(--accent-ocean)]">{adminStats.usersOnline}</p>
          <p className="sakh-meta mt-1">сейчас на сайте</p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Южно-Сахалинск</span>
              <span className="text-[var(--text-secondary)]">643</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Корсаков</span>
              <span className="text-[var(--text-secondary)]">187</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Оха</span>
              <span className="text-[var(--text-secondary)]">95</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">Другие</span>
              <span className="text-[var(--text-secondary)]">322</span>
            </div>
          </div>
        </div>

        <div className="sakh-card p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="sakh-caption text-[var(--text-primary)]">Последние действия</h2>
            <Activity size={16} className="text-[var(--text-muted)]" />
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar">
            {recentActions.map((action) => (
              <div key={action.id} className="flex items-start gap-2 pb-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--text-primary)]">
                    <span className="font-medium">{action.user}</span>
                    {' '}
                    <span className="text-[var(--text-secondary)]">{action.action}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{action.target}</p>
                </div>
                <span className="sakh-meta shrink-0">{action.timestamp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sakh-card p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="sakh-caption text-[var(--text-primary)]">Алерты</h2>
            <AlertTriangle size={16} className="text-[var(--accent-sunset)]" />
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 pb-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className={`w-2 h-2 mt-1 shrink-0 rounded-full ${
                  alert.type === 'critical' ? 'bg-[var(--accent-sunset)]' :
                  alert.type === 'warning' ? 'bg-[#FFB800]' : 'bg-[var(--accent-ocean)]'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--text-primary)]">{alert.message}</p>
                  <p className="sakh-meta mt-0.5">{alert.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
