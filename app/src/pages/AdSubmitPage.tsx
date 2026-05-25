import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import adsService from '@/services/ads.service';
import type { CreateAdPayload } from '@/models/ads/CreateAdPayload';
import SEOHead from '@/components/SEOHead';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'realty', label: 'Недвижимость' },
  { value: 'auto', label: 'Авто' },
  { value: 'jobs', label: 'Работа' },
  { value: 'services', label: 'Услуги' },
  { value: 'electronics', label: 'Электроника' },
  { value: 'clothing', label: 'Одежда' },
];

export default function AdSubmitPage() {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: '',
      city: '',
      phone: '',
      photoUrl: '',
    },
  });

  const onSubmit = async (data: Record<string, string>) => {
    try {
      const payload: CreateAdPayload = {
        title: data.title,
        description: data.description,
        city: data.city,
        phone: data.phone,
      };
      if (data.category) payload.categoryId = data.category;
      const parsedPrice = Number(data.price.replace(/\s/g, '').replace('₽', ''));
      if (parsedPrice > 0) payload.price = parsedPrice;
      if (data.photoUrl) payload.images = [data.photoUrl];

      await adsService.create(payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data?: { message?: string } } }).response?.data?.message || 'Ошибка при отправке'
          : 'Ошибка при отправке';
      toast.error(msg);
    }
  };

  if (submitted) {
    return (
      <div className="pt-20 pb-8">
        <SEOHead title="Подать объявление | Сахалин" noIndex />
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
      <SEOHead title="Подать объявление | Сахалин" noIndex />
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="sakh-caption block mb-2">Категория</label>
              <select
                className="sakh-select"
                {...register('category')}
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
                {...register('title', { required: 'Обязательное поле' })}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="sakh-caption block mb-2">Описание</label>
              <textarea
                className="sakh-textarea"
                placeholder="Подробное описание"
                rows={5}
                {...register('description', { required: 'Обязательное поле' })}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="sakh-caption block mb-2">Цена</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="Например: 95 000 ₽"
                {...register('price')}
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Город</label>
              <input
                type="text"
                className="sakh-input"
                placeholder="Южно-Сахалинск"
                {...register('city', { required: 'Обязательное поле' })}
              />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="sakh-caption block mb-2">Телефон</label>
              <input
                type="tel"
                className="sakh-input"
                placeholder="+7 (962) 123-45-67"
                {...register('phone')}
              />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Ссылка на фото</label>
              <input
                type="url"
                className="sakh-input"
                placeholder="https://example.com/photo.jpg"
                {...register('photoUrl')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="sakh-btn sakh-btn--primary sakh-btn--lg w-full"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
