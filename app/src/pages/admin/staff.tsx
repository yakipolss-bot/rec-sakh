import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar, Check, X,
} from 'lucide-react';
import { adminService } from '@/services';
import type { StaffMember } from '@/models/admin/StaffMember';
import type { StaffScheduleItem } from '@/models/admin/StaffScheduleItem';

const shiftLabels: Record<string, string> = {
  morning: 'Утро (6-14)', day: 'День (14-22)', night: 'Ночь (22-6)',
};

const sections = ['Новости', 'Комментарии', 'Рубрики', 'Пользователи', 'Реклама', 'Настройки', 'Рассылки', 'Медиа'];
const staffRoles = ['Администратор', 'Редактор', 'Модератор', 'Пользователь'];

const defaultMatrix: Record<string, boolean[]> = {
  Администратор: [true, true, true, true, true, true, true, true],
  Редактор: [true, true, true, false, false, false, true, true],
  Модератор: [false, true, false, true, false, false, false, true],
  Пользователь: [false, false, false, false, false, false, false, false],
};

export default function AdminStaff() {
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [activeTab, setActiveTab] = useState<'staff' | 'schedule' | 'permissions'>('staff');

  const { data: staffRes, isLoading } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: () => adminService.getStaff({ perPage: 50 }).then(r => r.data),
  });
  const { data: scheduleData } = useQuery({
    queryKey: ['admin', 'staff-schedule'],
    queryFn: () => adminService.getStaffSchedule().catch(() => [] as StaffScheduleItem[]),
  });

  const staff = Array.isArray(staffRes) ? (staffRes as StaffMember[]) : [];
  const schedule = Array.isArray(scheduleData) ? (scheduleData as StaffScheduleItem[]) : [];

  const tabs = [
    { key: 'staff', label: 'Сотрудники' },
    { key: 'schedule', label: 'График' },
    { key: 'permissions', label: 'Доступ' },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="sakh-heading">Сотрудники редакции</h1>

      <div className="sakh-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`sakh-tabs__item ${activeTab === tab.key ? 'sakh-tabs__item--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="sakh-meta text-center py-8">Загрузка...</p>}

      {!isLoading && activeTab === 'staff' && (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Имя</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Роль</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статей/нед</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дата найма</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8"><p className="sakh-meta">Нет сотрудников</p></td>
                </tr>
              )}
              {staff.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                        {s.user.name.charAt(0)}
                      </div>
                      <span className="font-mono text-xs text-[var(--text-primary)]">{s.user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{s.position}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${s.isActive ? 'sakh-tag--accent' : 'sakh-tag--outline'}`}>
                      {s.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--accent-ocean)]">{s.kpiScore ?? '—'}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{s.hireDate?.slice(0, 10) || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && activeTab === 'schedule' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {schedule.length === 0 && (
            <p className="sakh-meta col-span-full text-center py-8">Нет записей графика</p>
          )}
          {schedule.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-[var(--accent-ocean)]" />
                <span className="font-mono text-xs text-[var(--text-primary)]">{s.date}</span>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{s.staffName}</p>
              <span className="sakh-tag sakh-tag--accent">{shiftLabels[s.shift] || s.shift}</span>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && activeTab === 'permissions' && (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Раздел</th>
                {staffRoles.map(r => (
                  <th key={r} className="text-center py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section, i) => (
                <motion.tr
                  key={section}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{section}</td>
                  {staffRoles.map((role, j) => (
                    <td key={role} className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          const next = [...matrix[role]];
                          next[j] = !next[j];
                          setMatrix(prev => ({ ...prev, [role]: next }));
                        }}
                        className={`inline-flex items-center justify-center w-6 h-6 border ${
                          matrix[role][j]
                            ? 'bg-[var(--accent-ocean)] border-[var(--accent-ocean)] text-[var(--bg-primary)]'
                            : 'border-[var(--border-color)] text-[var(--text-muted)]'
                        }`}
                      >
                        {matrix[role][j] ? <Check size={12} /> : <X size={12} />}
                      </button>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
