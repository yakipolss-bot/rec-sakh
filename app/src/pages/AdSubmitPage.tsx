import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';
import { adsService } from '@/services/ads.service';
import type { CreateAdPayload } from '@/services/ads.service';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'realty', label: 'Недвижимость' },
  { value: 'auto', label: 'Авто' },
  { value: 'jobs', label: 'Работа' },
  { value: 'services', label: 'Услуги' },
  { value: 'electronics', label: 'Электроника' },
  { value: 'clothing', label: 'Одежда' },
];

export default function AdSubmitPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: CreateAdPayload = {
        title,
        description,
        city,
        phone,
      };
      if (category) payload.categoryId = category;
      const parsedPrice = Number(price.replace(/\s/g, '').replace('₽', ''));
      if (parsedPrice > 0) payload.price = parsedPrice;
      if (photoUrl) payload.images = [photoUrl];

      await adsService.create(payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || 'Ошибка при отправке'
          : 'Ошибка при отправке';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-20 pb-8">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6">
          <div className="sakh-empty">
            <h1 className="sakh-empty__title">Объявление отправлено на модерацию</h1>
            <p className="sakh-empty__description">После проверки оно появится в ленте.</p>
            <Link to="/ads" className="sakh-btn sakh-btn--primary sakh-btn--md">К объявлениям</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <Link to="/ads" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">Объявления</Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Подать объявление</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="sakh-heading mb-2">Подать объявление</h1>
          <p className="sakh-body mb-8">Заполните форму — после модерации объявление появится на сайте</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
              role="alert"
            >
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="sakh-caption block mb-2">Категория</label>
              <select
                className="sakh-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="sakh-caption block mb-2">Заголовок</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="Например: Продам iPhone 15 Pro"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Описание</label>
              <textarea
                className="sakh-textarea"
                placeholder="Подробное описание"
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Цена</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="Например: 95 000 ₽"
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Город</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="Южно-Сахалинск"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Телефон</label>
              <input
                type="tel"
                className="sakh-input"
                placeholder="+7 (962) 123-45-67"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Ссылка на фото</label>
              <input
                type="url"
                className="sakh-input"
                placeholder="https://example.com/photo.jpg"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sakh-btn sakh-btn--primary sakh-btn--lg w-full"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {loading ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
