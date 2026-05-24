import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import usersService from '@/services/users.service';
import { toast } from 'sonner';

export default function AccountProfile() {
  const { user, isLoading, error, refetch } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    birthDate: '',
    gender: 'male',
    about: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        birthDate: '',
        gender: 'male',
        about: '',
      });
      setAvatarUrl(user.avatarUrl || user.avatar || null);
    }
  }, [user]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await usersService.updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
      });
      toast.success('Профиль обновлен');
      refetch?.();
    } catch {
      toast.error('Ошибка при сохранении профиля');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Только JPEG, PNG, WebP, GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл больше 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const result = await usersService.uploadAvatar(file);
      const url = result.url;
      setAvatarUrl(url);
      toast.success('Аватар обновлён');
      refetch?.();
    } catch {
      toast.error('Ошибка загрузки аватара');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (error) {
    return (
      <div className="sakh-card p-4 text-center">
        <p className="text-[var(--accent-sunset)]">Ошибка загрузки профиля</p>
        <button onClick={() => window.location.reload()} className="sakh-btn sakh-btn--sm mt-4">
          Перезагрузить
        </button>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="sakh-card p-4 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
          <User size={16} className="text-[var(--accent-ocean)]" />
          Личные данные
        </h3>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-20 h-20 object-cover border-2 border-[var(--accent-ocean)]"
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center text-2xl font-mono uppercase bg-[var(--bg-surface)] text-[var(--accent-ocean)] border-2 border-[var(--accent-ocean)]">
                {form.name.charAt(0)}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center bg-[var(--accent-ocean)] text-[var(--bg-primary)] hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{form.name}</p>
            <p className="sakh-meta text-xs">JPEG, PNG, WebP, GIF до 5MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="sakh-caption block mb-1">Имя</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              className="sakh-input"
            />
          </div>
          <div>
            <label className="sakh-caption block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              className="sakh-input"
            />
          </div>
          <div>
            <label className="sakh-caption block mb-1">Телефон</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              className="sakh-input"
            />
          </div>
          <div>
            <label className="sakh-caption block mb-1">Город</label>
            <input
              type="text"
              value={form.city}
              onChange={e => handleChange('city', e.target.value)}
              className="sakh-input"
            />
          </div>
          <div>
            <label className="sakh-caption block mb-1">Дата рождения</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={e => handleChange('birthDate', e.target.value)}
              className="sakh-input"
            />
          </div>
          <div>
            <label className="sakh-caption block mb-1">Пол</label>
            <select
              value={form.gender}
              onChange={e => handleChange('gender', e.target.value)}
              className="sakh-select"
            >
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
              <option value="other">Другой</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="sakh-caption block mb-1">О себе</label>
          <textarea
            value={form.about}
            onChange={e => handleChange('about', e.target.value)}
            className="sakh-textarea"
            placeholder="Расскажите немного о себе..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="sakh-btn sakh-btn--primary sakh-btn--lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </motion.div>
  );
}
