import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, UserX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { blockedUsers } from '@/data/accountMock';
import EmptyState from '@/components/EmptyState';

export default function AccountPrivacy() {
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showOnline: true,
    emailVisibility: 'all',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <Eye size={16} className="text-[var(--accent-ocean)]" />
          Приватность
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">Видимость профиля</span>
            <Switch checked={privacy.profileVisible} onCheckedChange={v => setPrivacy(p => ({ ...p, profileVisible: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">Показывать онлайн</span>
            <Switch checked={privacy.showOnline} onCheckedChange={v => setPrivacy(p => ({ ...p, showOnline: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">Кому видна почта</span>
            <select
              value={privacy.emailVisibility}
              onChange={e => setPrivacy(p => ({ ...p, emailVisibility: e.target.value }))}
              className="sakh-select w-auto"
            >
              <option value="all">Всем</option>
              <option value="registered">Зарегистрированным</option>
              <option value="nobody">Никому</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <UserX size={16} className="text-[var(--accent-ocean)]" />
          Заблокированные пользователи
        </h3>
        {blockedUsers.length > 0 ? (
          <div className="space-y-2">
            {blockedUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 border border-[var(--border-color)] text-sm">
                <span className="text-[var(--text-primary)]">{u.name}</span>
                <button type="button" className="sakh-link text-xs">Разблокировать</button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Нет заблокированных"
            description="Вы никого не блокировали"
            icon={<UserX size={48} />}
          />
        )}
      </div>

      <div className="flex justify-end">
        <button type="button" className="sakh-btn sakh-btn--primary sakh-btn--lg">
          Сохранить
        </button>
      </div>
    </motion.div>
  );
}
