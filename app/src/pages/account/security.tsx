import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, QrCode, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const sessions = [
  { id: 's1', device: 'Chrome на Windows', ip: '192.168.1.42', lastActive: 'Сейчас', current: true },
  { id: 's2', device: 'Safari на iOS', ip: '10.0.0.5', lastActive: '2 часа назад', current: false },
  { id: 's3', device: 'Firefox на macOS', ip: '77.88.55.66', lastActive: '3 дня назад', current: false },
];

export default function AccountSecurity() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [showQR, setShowQR] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <Shield size={16} className="text-[var(--accent-ocean)]" />
          Смена пароля
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
        </div>
      </div>

      <div className="sakh-card p-4 sm:p-5">
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

      <div className="sakh-card p-4 sm:p-5">
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

      <div className="flex justify-end">
        <button type="button" className="sakh-btn sakh-btn--primary sakh-btn--lg">
          Сохранить
        </button>
      </div>
    </motion.div>
  );
}
