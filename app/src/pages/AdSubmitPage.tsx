import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';

const CATEGORIES = [
  { value: 'realty', label: 'Недвижимость' },
  { value: 'auto', label: 'Авто' },
  { value: 'jobs', label: 'Работа' },
  { value: 'services', label: 'Услуги' },
  { value: 'electronics', label: 'Электроника' },
  { value: 'clothing', label: 'Одежда' },
];

export default function AdSubmitPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="sakh-caption block mb-2">Категория</label>
              <select className="sakh-select" required>
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="sakh-caption block mb-2">Заголовок</label>
              <input type="text" className="sakh-input" placeholder="Например: Продам iPhone 15 Pro" required />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Описание</label>
              <textarea className="sakh-textarea" placeholder="Подробное описание" rows={5} required />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Цена</label>
              <input type="text" className="sakh-input" placeholder="Например: 95 000 ₽" required />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Город</label>
              <input type="text" className="sakh-input" placeholder="Южно-Сахалинск" required />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Телефон</label>
              <input type="tel" className="sakh-input" placeholder="+7 (962) 123-45-67" required />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Ссылка на фото</label>
              <input type="url" className="sakh-input" placeholder="https://example.com/photo.jpg" />
            </div>

            <button type="submit" className="sakh-btn sakh-btn--primary sakh-btn--lg w-full">
              <Send size={16} />
              Отправить на модерацию
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
