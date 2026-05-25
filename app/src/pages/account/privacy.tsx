import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Shield, Database, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPrivacy() {
  const [deleteRequested, setDeleteRequested] = useState(false);

  const handleDeleteRequest = () => {
    setDeleteRequested(true);
    toast.success('Запрос на удаление данных отправлен');
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
          <Shield size={16} className="text-[var(--accent-ocean)]" />
          Конфиденциальность данных
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Мы серьёзно относимся к защите ваших персональных данных. Вся информация,
          которую вы предоставляете, используется исключительно для обеспечения
          функционирования платформы и улучшения пользовательского опыта.
        </p>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-start gap-2">
            <Shield size={14} className="text-green-500 mt-0.5 shrink-0" />
            Ваши данные не передаются третьим лицам без вашего согласия
          </li>
          <li className="flex items-start gap-2">
            <Database size={14} className="text-green-500 mt-0.5 shrink-0" />
            Все данные хранятся на защищённых серверах
          </li>
          <li className="flex items-start gap-2">
            <Eye size={14} className="text-green-500 mt-0.5 shrink-0" />
            Вы в любой момент можете просмотреть и изменить свои данные в профиле
          </li>
          <li className="flex items-start gap-2">
            <Mail size={14} className="text-green-500 mt-0.5 shrink-0" />
            Мы не отправляем спам и не используем email для рекламы
          </li>
        </ul>
      </div>

      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <Database size={16} className="text-[var(--accent-ocean)]" />
          Управление данными
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Вы можете запросить удаление всех ваших данных с платформы. Обратите внимание,
          что это действие необратимо — после удаления восстановить аккаунт будет невозможно.
        </p>
        <button
          onClick={handleDeleteRequest}
          disabled={deleteRequested}
          className="sakh-btn sakh-btn--outline sakh-btn--sm flex items-center gap-2 disabled:opacity-50"
        >
          <Trash2 size={14} />
          {deleteRequested ? 'Запрос отправлен' : 'Запросить удаление данных'}
        </button>
      </div>

      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-2">Файлы cookie</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Мы используем минимально необходимый набор cookie-файлов для обеспечения
          работы платформы. Мы не используем трекеры и не собираем данные для
          рекламных целей. Вы можете отключить cookie в настройках браузера,
          но это может повлиять на работу некоторых функций.
        </p>
      </div>
    </motion.div>
  );
}
