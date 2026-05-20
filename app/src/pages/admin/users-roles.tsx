import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Shield, Plus } from 'lucide-react';
import { adminService } from '@/services';

const roleLabels: Record<string, string> = {
  admin: 'Администратор', editor: 'Редактор', moderator: 'Модератор', user: 'Пользователь',
};

const sections = ['Новости', 'Комментарии', 'Рубрики', 'Пользователи', 'Реклама', 'Настройки', 'Рассылки', 'Медиа'];

const defaultPermissions: Record<string, boolean[]> = {
  admin: [true, true, true, true, true, true, true, true],
  editor: [true, true, true, false, false, false, true, true],
  moderator: [false, true, false, true, false, false, false, true],
  user: [false, false, false, false, false, false, false, false],
};

export default function AdminUsersRoles() {
  const [roleCounts, setRoleCounts] = useState<{ role: string; label: string; count: number }[]>([]);

  useEffect(() => {
    adminService.getUsers({ perPage: 1 })
      .then(async ({ meta }) => {
        const { data: allUsers } = await adminService.getUsers({ perPage: meta?.total || 100 });
        return allUsers;
      })
      .then(users => {
        const counts = Object.keys(roleLabels).map(role => ({
          role,
          label: roleLabels[role],
          count: users.filter(u => u.role === role).length,
        }));
        setRoleCounts(counts);
      })
      .catch(() => {
        setRoleCounts(Object.keys(roleLabels).map(role => ({
          role, label: roleLabels[role], count: 0,
        })));
      });
  }, []);

  const roles = Object.keys(roleLabels);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Управление ролями</h1>
        <button className="sakh-btn sakh-btn--primary sakh-btn--sm" onClick={() => toast.info('Добавление ролей — в разработке')}>
          <Plus size={14} />
          Добавить роль
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {roleCounts.map((rc, i) => (
          <motion.div
            key={rc.role}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="sakh-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-[var(--accent-ocean)]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-primary)]">{rc.label}</span>
            </div>
            <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">{rc.count}</p>
            <p className="sakh-meta">пользователей</p>
          </motion.div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="sakh-table w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Раздел</th>
              {roles.map(r => (
                <th key={r} className="text-center py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">{roleLabels[r]}</th>
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
                {roles.map(r => (
                  <td key={r} className="py-3 px-3 text-center">
                    {defaultPermissions[r]?.[i] ? (
                      <span className="text-[var(--accent-ocean)] font-mono text-xs">Да</span>
                    ) : (
                      <span className="text-[var(--text-muted)] font-mono text-xs">—</span>
                    )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
