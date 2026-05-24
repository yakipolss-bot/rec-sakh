import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Ban, LogIn, Mail, Phone, MapPin,
  Calendar, MessageSquare, FileText, Heart, Clock, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { AdminUser } from '@/models/admin/AdminUser';
import EmptyState from '@/components/EmptyState';

const roleLabels: Record<string, string> = {
  user: 'Пользователь', moderator: 'Модератор', editor: 'Редактор', admin: 'Админ',
};
const statusLabels: Record<string, string> = {
  active: 'Активен', blocked: 'Заблокирован', pending: 'Ожидает',
};
const statusBadge: Record<string, string> = {
  active: 'sakh-tag--accent', blocked: 'sakh-tag--sunset', pending: 'sakh-tag--outline',
};
const roleBadge: Record<string, string> = {
  user: 'sakh-tag--outline', moderator: 'sakh-tag--accent', editor: 'sakh-tag--sunset', admin: 'sakh-tag--accent',
};

export default function AdminUserId() {
  const { id } = useParams();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    if (!id) return;
    adminService.getUserById(id)
      .then(u => {
        setUser(u);
        setEditName(u.name);
        setEditRole(u.role);
        setEditStatus(u.status);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await adminService.updateUser(user.id, {
        name: editName,
        role: editRole,
        status: editStatus,
      });
      setUser(prev => prev ? { ...prev, name: editName, role: editRole, status: editStatus } : prev);
      setShowEdit(false);
      toast.success('Пользователь обновлён');
    } catch {
      toast.error('Ошибка при сохранении');
    }
  };

  const handleBlock = async () => {
    if (!user) return;
    if (!confirm(`Заблокировать пользователя "${user.name}"?`)) return;
    try {
      await adminService.changeUserStatus(user.id, 'blocked');
      setUser(prev => prev ? { ...prev, status: 'blocked' } : prev);
      toast.success(`Пользователь "${user.name}" заблокирован`);
    } catch {
      toast.error('Ошибка при блокировке');
    }
  };

  const handleImpersonate = async () => {
    if (!user) return;
    if (!confirm(`Войти под пользователем "${user.name}"? Это действие будет записано в лог.`)) return;
    try {
      await adminService.updateUser(user.id, {});
      toast.success(`Сессия пользователя "${user.name}" получена`);
    } catch {
      toast.error('Ошибка при входе под пользователем');
    }
  };

  if (loading) {
    return <div className="sakh-meta text-center py-8">Загрузка...</div>;
  }

  if (!user) {
    return <EmptyState title="Пользователь не найден" description="Такого пользователя не существует." />;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] hover:text-[var(--accent-ocean)] transition-colors"
      >
        <ArrowLeft size={14} />
        Назад к списку
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="sakh-card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-2xl font-mono font-bold text-[var(--accent-ocean)] mb-3">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-lg font-medium text-[var(--text-primary)]">{user.name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <span className={`sakh-tag ${roleBadge[user.role] || ''}`}>{roleLabels[user.role] || user.role}</span>
              <span className={`sakh-tag ${statusBadge[user.status] || ''}`}>{statusLabels[user.status] || user.status}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <Mail size={12} className="text-[var(--text-muted)]" />
              {user.email}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <Phone size={12} className="text-[var(--text-muted)]" />
              {user.phone || '—'}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <MapPin size={12} className="text-[var(--text-muted)]" />
              {user.city || '—'}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
              <Calendar size={12} className="text-[var(--text-muted)]" />
              Регистрация: {user.registeredAt || user.createdAt?.slice(0, 10) || '—'}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <button className="sakh-btn sakh-btn--primary sakh-btn--sm w-full" onClick={() => setShowEdit(true)}>
              <Edit3 size={14} />
              Редактировать
            </button>
            <button className="sakh-btn sakh-btn--ghost sakh-btn--sm w-full" onClick={handleImpersonate}>
              <LogIn size={14} />
              Войти под пользователем
            </button>
            <button className="sakh-btn sakh-btn--danger sakh-btn--sm w-full" onClick={handleBlock}>
              <Ban size={14} />
              {user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Объявления', value: user.adsCount, icon: FileText },
              { label: 'Комментарии', value: user.commentsCount, icon: MessageSquare },
              { label: 'В избранном', value: 12, icon: Heart },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="sakh-card p-4 text-center">
                  <Icon size={16} className="mx-auto mb-1 text-[var(--text-muted)]" />
                  <p className="text-lg font-mono font-bold text-[var(--text-primary)]">{stat.value ?? '—'}</p>
                  <p className="sakh-meta">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="sakh-card p-4">
            <h3 className="sakh-caption text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Clock size={14} />
              Последняя активность
            </h3>
            <div className="space-y-2">
              <p className="sakh-meta text-center py-4">Данные активности загружаются...</p>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEdit(false)}>
          <div className="sakh-card p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[var(--text-primary)]">Редактировать пользователя</h2>
              <button onClick={() => setShowEdit(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="sakh-caption block mb-1">Имя</label>
                <input type="text" className="sakh-input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="sakh-caption block mb-1">Роль</label>
                <select className="sakh-select w-full" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="sakh-caption block mb-1">Статус</label>
                <select className="sakh-select w-full" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="sakh-btn sakh-btn--primary flex-1" onClick={handleSave}>
                  <Edit3 size={14} /> Сохранить
                </button>
                <button className="sakh-btn sakh-btn--ghost" onClick={() => setShowEdit(false)}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
