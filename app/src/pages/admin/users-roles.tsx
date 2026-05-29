import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Shield, Plus, X } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [newPerms, setNewPerms] = useState<boolean[]>(sections.map(() => false));

  const { data: allUsers } = useQuery({
    queryKey: ['admin', 'users-all'],
    queryFn: () =>
      adminService.getUsers({ perPage: 1 })
        .then(async ({ meta }) => {
          const { data } = await adminService.getUsers({ perPage: Number(meta?.total) || 100 });
          return data;
        })
        .catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: () => adminService.createRole(newRoleName, newRoleLabel, newPerms),
    onSuccess: () => {
      toast.success(`Роль «${newRoleLabel}» создана`);
      setShowModal(false);
      setNewRoleName('');
      setNewRoleLabel('');
      setNewPerms(sections.map(() => false));
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: () => {
      toast.error('Не удалось создать роль. Возможно, API ещё не реализован.');
    },
  });

  const roleCounts = Object.keys(roleLabels).map(role => ({
    role,
    label: roleLabels[role],
    count: Array.isArray(allUsers) ? allUsers.filter((u: { role: string }) => u.role === role).length : 0,
  }));

  const roles = Object.keys(roleLabels);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Управление ролями</h1>
        <button className="sakh-btn sakh-btn--primary sakh-btn--sm" onClick={() => setShowModal(true)}>
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

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-primary)] w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                <h2 className="sakh-heading text-base">Новая роль</h2>
                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sakh-caption text-[var(--text-secondary)] block mb-1">Ключ (англ.)</label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      className="sakh-input"
                      placeholder="Например: contributor"
                    />
                  </div>
                  <div>
                    <label className="sakh-caption text-[var(--text-secondary)] block mb-1">Название</label>
                    <input
                      type="text"
                      value={newRoleLabel}
                      onChange={(e) => setNewRoleLabel(e.target.value)}
                      className="sakh-input"
                      placeholder="Например: Контрибьютор"
                    />
                  </div>
                </div>

                <div>
                  <label className="sakh-caption text-[var(--text-secondary)] block mb-2">Права доступа</label>
                  <div className="space-y-1">
                    {sections.map((section, i) => (
                      <label
                        key={section}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newPerms[i]}
                          onChange={() => {
                            const next = [...newPerms];
                            next[i] = !next[i];
                            setNewPerms(next);
                          }}
                          className="w-4 h-4 accent-[var(--accent-ocean)]"
                        />
                        <span className="text-sm text-[var(--text-primary)]">{section}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                <button onClick={() => setShowModal(false)} className="sakh-btn sakh-btn--ghost sakh-btn--sm">
                  Отмена
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!newRoleName.trim() || !newRoleLabel.trim() || createMutation.isPending}
                  className="sakh-btn sakh-btn--primary sakh-btn--sm"
                >
                  {createMutation.isPending ? 'Сохранение...' : 'Создать'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
