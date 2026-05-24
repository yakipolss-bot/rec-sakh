import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ChevronRight, Eye, Ban, Trash2,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { AdminUser } from '@/models/admin/AdminUser';

const roles = ['Все', 'user', 'moderator', 'editor', 'admin'];
const statuses = ['Все', 'active', 'blocked', 'pending'];

const roleBadge: Record<string, string> = {
  user: 'sakh-tag--outline',
  moderator: 'sakh-tag--accent',
  editor: 'sakh-tag--sunset',
  admin: 'sakh-tag--accent',
};

const statusBadge: Record<string, string> = {
  active: 'sakh-tag--accent',
  blocked: 'sakh-tag--sunset',
  pending: 'sakh-tag--outline',
};

const roleLabels: Record<string, string> = {
  user: 'Пользователь',
  moderator: 'Модератор',
  editor: 'Редактор',
  admin: 'Админ',
};

const statusLabels: Record<string, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
  pending: 'Ожидает',
};

const ITEMS_PER_PAGE = 6;

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Все');
  const [statusFilter, setStatusFilter] = useState('Все');
  const [cityFilter, setCityFilter] = useState('Все');
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminService.getUsers({ perPage: 100 })
      .then(({ data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => ['Все', ...new Set(users.map(u => u.city || '').filter(Boolean))], [users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter !== 'Все' && u.role !== roleFilter) return false;
      if (statusFilter !== 'Все' && u.status !== statusFilter) return false;
      if (cityFilter !== 'Все' && u.city !== cityFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter, cityFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleBan = async (u: AdminUser) => {
    if (!confirm(`Заблокировать пользователя "${u.name}"?`)) return;
    try {
      await adminService.changeUserStatus(u.id, 'blocked');
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: 'blocked' as const } : x));
      toast.success(`Пользователь "${u.name}" заблокирован`);
    } catch {
      toast.error('Ошибка при блокировке');
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`Удалить пользователя "${u.name}"? Это действие необратимо.`)) return;
    try {
      await adminService.blockUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success(`Пользователь "${u.name}" удалён`);
    } catch {
      toast.error('Ошибка при удалении');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="sakh-heading">Пользователи</h1>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="sakh-search flex-1 min-w-[200px]">
          <Search className="sakh-search__icon" size={14} />
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            className="sakh-search__input !h-9 !text-xs !pl-8"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="sakh-select !w-auto !h-9 !text-xs"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          {roles.map(r => (
            <option key={r} value={r}>{r === 'Все' ? 'Все роли' : roleLabels[r]}</option>
          ))}
        </select>
        <select
          className="sakh-select !w-auto !h-9 !text-xs"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'Все' ? 'Все статусы' : statusLabels[s]}</option>
          ))}
        </select>
        <select
          className="sakh-select !w-auto !h-9 !text-xs"
          value={cityFilter}
          onChange={e => { setCityFilter(e.target.value); setPage(1); }}
        >
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="sakh-meta text-center py-8">Загрузка...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Имя</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Email</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Роль</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Статус</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Город</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дата рег.</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Объявл.</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Комм.</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <p className="sakh-meta">Пользователи не найдены</p>
                  </td>
                </tr>
              )}
              {paged.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3">
                    <Link to={`/admin/users/${user.id}`} className="text-[var(--accent-ocean)] font-mono text-xs hover:underline">
                      {user.name}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{user.email}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${roleBadge[user.role] || ''}`}>{roleLabels[user.role] || user.role}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${statusBadge[user.status] || ''}`}>{statusLabels[user.status] || user.status}</span>
                  </td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{user.city || '—'}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{user.registeredAt || user.createdAt?.slice(0, 10) || '—'}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{user.adsCount ?? '—'}</td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{user.commentsCount ?? '—'}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                        title="Редактировать"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                        title="Заблокировать"
                        onClick={() => handleBan(user)}
                      >
                        <Ban size={14} />
                      </button>
                      <button
                        className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                        title="Удалить"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 size={14} />
                      </button>
                      <Link to={`/admin/users/${user.id}`} className="sakh-btn sakh-btn--ghost sakh-btn--sm" title="Открыть">
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="sakh-pagination justify-center">
          <button
            className="sakh-pagination__item"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`sakh-pagination__item ${page === i + 1 ? 'sakh-pagination__item--active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="sakh-pagination__item"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
