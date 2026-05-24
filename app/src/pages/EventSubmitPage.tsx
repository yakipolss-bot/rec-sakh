import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../services/api-client';
import SEOHead from '@/components/SEOHead';

const CATEGORIES = [
  { value: '', label: 'Выберите категорию' },
  { value: 'kino', label: 'Кино' },
  { value: 'teatr', label: 'Театр' },
  { value: 'kontserty', label: 'Концерт' },
  { value: 'vystavki', label: 'Выставка' },
  { value: 'sport', label: 'Спорт' },
  { value: 'festivali', label: 'Фестиваль' },
  { value: 'master-klassy', label: 'Мастер-класс' },
  { value: 'ekskursii', label: 'Экскурсия' },
  { value: 'detyam', label: 'Детям' },
];

export default function EventSubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [catMap, setCatMap] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    categorySlug: '',
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    venueAddress: '',
    city: 'Южно-Сахалинск',
    price: '',
    ageRestriction: '0+',
    imageUrl: '',
    phone: '',
  });

  useEffect(() => {
    apiClient.get('/categories', { params: { type: 'events' } }).then((res) => {
      const cats = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const map: Record<string, string> = {};
      for (const c of cats) {
        map[c.slug] = c.id;
      }
      setCatMap(map);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.categorySlug) {
      toast.error('Заполните название, дату и категорию');
      return;
    }

    const categoryId = catMap[form.categorySlug];
    if (!categoryId) {
      toast.error('Выберите категорию из списка');
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || 'Описание события',
        shortDescription: form.description?.slice(0, 200) || undefined,
        categoryId,
        city: form.city,
        venueName: form.venue || undefined,
        venueAddress: form.venueAddress || undefined,
        startDate: form.time
          ? new Date(`${form.date}T${form.time}:00`).toISOString()
          : new Date(`${form.date}T19:00:00`).toISOString(),
        isFree: !form.price,
        price: form.price ? Number(form.price) : undefined,
        imageUrl: form.imageUrl || undefined,
      };

      await apiClient.post('/events', payload);
      setSubmitted(true);
    } catch {
      toast.error('Ошибка отправки. Попробуйте позже.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-20 pb-8">
        <SEOHead title="Создать событие | Сахалин" noIndex />
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="sakh-empty">
            <h1 className="sakh-empty__title">Событие отправлено на модерацию</h1>
            <p className="sakh-empty__description">После проверки оно появится в афише.</p>
            <Link to="/events" className="sakh-btn sakh-btn--primary sakh-btn--md">
              К афише
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Создать событие | Сахалин" noIndex />
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <Link to="/events" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            Афиша
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Добавить событие</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="sakh-heading mb-2">Добавить событие</h1>
          <p className="sakh-body mb-8">Заполните форму — после модерации событие появится в афише</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="sakh-caption block mb-2">Категория *</label>
              <select
                className="sakh-select"
                value={form.categorySlug}
                onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
                required
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="sakh-caption block mb-2">Название события *</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="Введите название"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Описание</label>
              <textarea
                className="sakh-textarea"
                placeholder="Подробное описание события"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sakh-caption block mb-2">Дата *</label>
                <input
                  type="date"
                  className="sakh-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="sakh-caption block mb-2">Время</label>
                <input
                  type="time"
                  className="sakh-input"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sakh-caption block mb-2">Место проведения</label>
                <input
                  type="text"
                  className="sakh-input"
                  placeholder="Название площадки"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                />
              </div>
              <div>
                <label className="sakh-caption block mb-2">Город</label>
                <input
                  type="text"
                  className="sakh-input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sakh-caption block mb-2">Цена (если платно)</label>
                <input
                  type="number"
                  className="sakh-input"
                  placeholder="Например: 500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label className="sakh-caption block mb-2">Возрастное ограничение</label>
                <select
                  className="sakh-select"
                  value={form.ageRestriction}
                  onChange={(e) => setForm({ ...form, ageRestriction: e.target.value })}
                >
                  <option value="0+">0+</option>
                  <option value="6+">6+</option>
                  <option value="12+">12+</option>
                  <option value="16+">16+</option>
                  <option value="18+">18+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="sakh-caption block mb-2">Ссылка на изображение</label>
              <input
                type="url"
                className="sakh-input"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Адрес площадки</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="ул. Ленина, 1"
                value={form.venueAddress}
                onChange={(e) => setForm({ ...form, venueAddress: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="sakh-btn sakh-btn--primary sakh-btn--lg w-full"
              disabled={sending}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
