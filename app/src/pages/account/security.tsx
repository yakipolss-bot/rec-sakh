import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import usersService from '@/services/users.service';
import { toast } from 'sonner';

export default function AccountSecurity() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const requirements = [
    { label: 'Минимум 8 символов', met: form.newPassword.length >= 8 },
    { label: 'Заглавная буква', met: /[A-Z]/.test(form.newPassword) },
    { label: 'Строчная буква', met: /[a-z]/.test(form.newPassword) },
    { label: 'Цифра', met: /\d/.test(form.newPassword) },
  ];

  const allMet = requirements.every(r => r.met);
  const doMatch = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0;
  const canSubmit = form.oldPassword && form.newPassword && allMet && doMatch;

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await usersService.changePassword(form.oldPassword, form.newPassword);
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess(true);
      toast.success('Пароль успешно изменён');
    } catch {
      toast.error('Ошибка при смене пароля. Проверьте правильность текущего пароля.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-lg space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <Lock size={16} className="text-[var(--accent-ocean)]" />
          Смена пароля
        </h3>

        <div className="space-y-4">
          <div>
            <label className="sakh-caption block mb-1">Текущий пароль</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={form.oldPassword}
                onChange={e => handleChange('oldPassword', e.target.value)}
                className="sakh-input pr-10"
                placeholder="Введите текущий пароль"
              />
            </div>
          </div>

          <div>
            <label className="sakh-caption block mb-1">Новый пароль</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => handleChange('newPassword', e.target.value)}
                className="sakh-input pr-10"
                placeholder="Введите новый пароль"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {requirements.map(req => (
              <div key={req.label} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <Check size={12} className="text-green-500 shrink-0" />
                ) : (
                  <X size={12} className="text-[var(--text-muted)] shrink-0" />
                )}
                <span className={req.met ? 'text-green-500' : 'text-[var(--text-secondary)]'}>
                  {req.label}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className="sakh-caption block mb-1">Подтвердите новый пароль</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={e => handleChange('confirmPassword', e.target.value)}
              className="sakh-input"
              placeholder="Повторите новый пароль"
            />
            {form.confirmPassword.length > 0 && (
              <p className={`text-xs mt-1 ${doMatch ? 'text-green-500' : 'text-[var(--accent-sunset)]'}`}>
                {doMatch ? 'Пароли совпадают' : 'Пароли не совпадают'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSubmit || isSaving}
          className="sakh-btn sakh-btn--primary sakh-btn--lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Сохранение...' : 'Изменить пароль'}
        </button>
      </div>
    </motion.div>
  );
}
