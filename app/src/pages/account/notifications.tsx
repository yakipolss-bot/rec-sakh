import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Send } from 'lucide-react';

export default function AccountNotifications() {
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

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <Bell size={16} className="text-[var(--accent-ocean)]" />
          Уведомления
        </h3>
        <div className="space-y-5">
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

      <div className="flex justify-end">
        <button type="button" className="sakh-btn sakh-btn--primary sakh-btn--lg">
          Сохранить
        </button>
      </div>
    </motion.div>
  );
}
