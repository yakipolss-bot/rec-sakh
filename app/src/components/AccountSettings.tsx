import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Shield, Bell, Eye, Key, Smartphone,
  Monitor, QrCode, Mail, MessageSquare, AlertTriangle,
  CloudSun, Train, ToggleLeft
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { currentUser } from '@/data/mock';

const sessions = [
  { id: 's1', device: 'Chrome на Windows', ip: '192.168.1.42', lastActive: 'Сейчас', current: true },
  { id: 's2', device: 'Safari на iOS', ip: '10.0.0.5', lastActive: '2 часа назад', current: false },
  { id: 's3', device: 'Firefox на macOS', ip: '77.88.55.66', lastActive: '3 дня назад', current: false },
];

export default function AccountSettings() {
  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    city: currentUser.city,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [twoFA, setTwoFA] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [notifications, setNotifications] = useState({
    emailDigest: true,
    emailReplies: true,
    emailModeration: false,
    smsImportant: true,
    smsStorm: true,
    smsTransport: false,
    pushInstant: true,
    telegramDigest: false,
    telegramEmergency: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showOnline: true,
    emailVisibility: 'all',
  });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-2xl space-y-4">
        <div className="sakh-card p-4">
          <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
            <User size={16} className="text-[var(--accent-ocean)]" />
            Личные данные
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="sakh-caption block mb-1">Имя</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Телефон</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Город</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="sakh-input"
              />
            </div>
          </div>
        </div>

        <div className="sakh-card p-4">
          <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
            <Shield size={16} className="text-[var(--accent-ocean)]" />
            Безопасность
          </h3>
          <div className="space-y-4">
            <div>
              <label className="sakh-caption block mb-1">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="sakh-input"
              />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Подтверждение пароля</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="sakh-input"
              />
            </div>

            <div className="border-t border-[var(--border-color)] pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className="text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Двухфакторная аутентификация</span>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={twoFA} onCheckedChange={setTwoFA} />
                  <button
                    type="button"
                    onClick={() => setShowQR(!showQR)}
                    className="sakh-btn sakh-btn--ghost sakh-btn--sm"
                  >
                    <QrCode size={14} />
                  </button>
                </div>
              </div>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-center p-4 border border-[var(--border-color)] bg-[var(--bg-primary)]"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-32 border-2 border-[var(--accent-ocean)] flex items-center justify-center bg-white">
                      <QrCode size={80} className="text-black" />
                    </div>
                    <span className="sakh-caption">QR-код для настройки 2FA</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="border-t border-[var(--border-color)] pt-4">
              <h4 className="sakh-caption font-medium mb-3 flex items-center gap-2">
                <Monitor size={14} className="text-[var(--text-secondary)]" />
                Активные сессии
              </h4>
              <div className="space-y-2">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 border border-[var(--border-color)] text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Monitor size={14} className="text-[var(--text-muted)]" />
                      <div>
                        <p className="text-[var(--text-primary)]">
                          {s.device}
                          {s.current && <span className="text-[var(--accent-ocean)] ml-2 text-xs">(текущая)</span>}
                        </p>
                        <p className="text-[var(--text-muted)] text-xs font-mono">{s.ip} · {s.lastActive}</p>
                      </div>
                    </div>
                    {!s.current && (
                      <button type="button" className="sakh-link text-xs">Завершить</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sakh-card p-4">
          <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
            <Bell size={16} className="text-[var(--accent-ocean)]" />
            Уведомления
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="sakh-caption mb-2 flex items-center gap-2">
                <Mail size={12} />
                Email
              </h4>
              <div className="space-y-2 ml-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.emailDigest} onChange={() => toggleNotif('emailDigest')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Дайджест новостей</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.emailReplies} onChange={() => toggleNotif('emailReplies')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Ответы на комментарии</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.emailModeration} onChange={() => toggleNotif('emailModeration')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Модерация</span>
                </label>
              </div>
            </div>
            <div>
              <h4 className="sakh-caption mb-2 flex items-center gap-2">
                <MessageSquare size={12} />
                SMS
              </h4>
              <div className="space-y-2 ml-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.smsImportant} onChange={() => toggleNotif('smsImportant')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Важные новости</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.smsStorm} onChange={() => toggleNotif('smsStorm')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Штормовые предупреждения</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.smsTransport} onChange={() => toggleNotif('smsTransport')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Транспортные отмены</span>
                </label>
              </div>
            </div>
            <div>
              <h4 className="sakh-caption mb-2 flex items-center gap-2">
                <Bell size={12} />
                Push
              </h4>
              <div className="space-y-2 ml-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.pushInstant} onChange={() => toggleNotif('pushInstant')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Мгновенные по подпискам</span>
                </label>
              </div>
            </div>
            <div>
              <h4 className="sakh-caption mb-2 flex items-center gap-2">
                <Send size={12} />
                Telegram-бот
              </h4>
              <div className="space-y-2 ml-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.telegramDigest} onChange={() => toggleNotif('telegramDigest')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Дайджест</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifications.telegramEmergency} onChange={() => toggleNotif('telegramEmergency')} className="sakh-checkbox" />
                  <span className="text-sm text-[var(--text-primary)]">Экстренные</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="sakh-card p-4">
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

        <div className="flex justify-end">
          <button type="button" className="sakh-btn sakh-btn--primary sakh-btn--lg">
            Сохранить изменения
          </button>
        </div>
      </div>
    </motion.div>
  );
}
