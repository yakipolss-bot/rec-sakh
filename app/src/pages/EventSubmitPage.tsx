import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  const { data: catMap = {} } = useQuery({
    queryKey: ['event-categories'],
    queryFn: () => apiClient.get('/categories', { params: { type: 'events' } }).then((res) => {
      const cats = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const map: Record<string, string> = {};
      for (const c of cats) {
        map[c.slug] = c.id;
      }
      return map;
    }),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
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
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    const categoryId = catMap[data.categorySlug];
    if (!categoryId) {
      toast.error('Выберите категорию из списка');
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description || 'Описание события',
        shortDescription: data.description?.slice(0, 200) || undefined,
        categoryId,
        city: data.city,
        venueName: data.venue || undefined,
        venueAddress: data.venueAddress || undefined,
        startDate: data.time
          ? new Date(`${data.date}T${data.time}:00`).toISOString()
          : new Date(`${data.date}T19:00:00`).toISOString(),
        isFree: !data.price,
        price: data.price ? Number(data.price) : undefined,
        imageUrl: data.imageUrl || undefined,
      };

      await apiClient.post('/events', payload);
      setSubmitted(true);
    } catch {
      toast.error('Ошибка отправки. Попробуйте позже.');
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="sakh-caption block mb-2">Категория *</label>
              <select
                className="sakh-select"
                {...register('categorySlug', { required: 'Выберите категорию' })}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.categorySlug && <p className="text-xs text-red-500 mt-1">{errors.categorySlug.message}</p>}
            </div>

            <div>
              <label className="sakh-caption block mb-2">Название события *</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="Введите название"
                {...register('title', { required: 'Обязательное поле' })}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="sakh-caption block mb-2">Описание</label>
              <textarea
                className="sakh-textarea"
                placeholder="Подробное описание события"
                {...register('description')}
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sakh-caption block mb-2">Дата *</label>
                <input
                  type="date"
                  className="sakh-input"
                  {...register('date', { required: 'Обязательное поле' })}
                />
                {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="sakh-caption block mb-2">Время</label>
                <input
                  type="time"
                  className="sakh-input"
                  {...register('time')}
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
                  {...register('venue')}
                />
              </div>
              <div>
                <label className="sakh-caption block mb-2">Город</label>
                <input
                  type="text"
                  className="sakh-input"
                  {...register('city')}
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
                  {...register('price')}
                />
              </div>
              <div>
                <label className="sakh-caption block mb-2">Возрастное ограничение</label>
                <select
                  className="sakh-select"
                  {...register('ageRestriction')}
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
                {...register('imageUrl')}
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Адрес площадки</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="ул. Ленина, 1"
                {...register('venueAddress')}
              />
            </div>

            <button
              type="submit"
              className="sakh-btn sakh-btn--primary sakh-btn--lg w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
