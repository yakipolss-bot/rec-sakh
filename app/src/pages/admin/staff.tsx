import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, Calendar, Check, X,
} from 'lucide-react';
import { adminStaff, staffSchedule, permissionMatrix } from '@/data/adminMock';

const statusLabels: Record<string, string> = {
  active: 'Активен', vacation: 'Отпуск', sick: 'Болен', offline: 'Не в сети',
};
const statusBadge: Record<string, string> = {
  active: 'sakh-tag--accent', vacation: 'sakh-tag--sunset', sick: 'sakh-tag--sunset', offline: 'sakh-tag--outline',
};
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

      {activeTab === 'staff' && (
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
              {adminStaff.map((staff, i) => (
                <motion.tr
                  key={staff.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                        {staff.name.charAt(0)}
                      </div>
                      <span className="font-mono text-xs text-[var(--text-primary)]">{staff.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{staff.role}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${statusBadge[staff.status]}`}>{statusLabels[staff.status]}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--accent-ocean)]">{staff.articlesPerWeek}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{staff.hiredAt}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staffSchedule.map((s, i) => (
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
              <span className="sakh-tag sakh-tag--accent">{shiftLabels[s.shift]}</span>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'permissions' && (
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
