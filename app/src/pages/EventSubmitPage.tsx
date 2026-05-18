import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';

const CATEGORIES = [
  { value: 'cinema', label: 'Кино' },
  { value: 'theatre', label: 'Театр' },
  { value: 'concert', label: 'Концерт' },
  { value: 'exhibition', label: 'Выставка' },
  { value: 'sport', label: 'Спорт' },
  { value: 'festival', label: 'Фестиваль' },
];

export default function EventSubmitPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pt-20 pb-8">
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
              <label className="sakh-caption block mb-2">Категория</label>
              <select className="sakh-select" required>
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="sakh-caption block mb-2">Название события</label>
              <input type="text" className="sakh-input" placeholder="Введите название" required />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Описание</label>
              <textarea className="sakh-textarea" placeholder="Подробное описание события" rows={5} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sakh-caption block mb-2">Дата</label>
                <input type="text" className="sakh-input" placeholder="Например: 25 мая" required />
              </div>
              <div>
                <label className="sakh-caption block mb-2">Время</label>
                <input type="text" className="sakh-input" placeholder="Например: 19:00" required />
              </div>
            </div>

            <div>
              <label className="sakh-caption block mb-2">Место проведения</label>
              <input type="text" className="sakh-input" placeholder="Название площадки" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="sakh-caption block mb-2">Цена</label>
                <input type="text" className="sakh-input" placeholder="Например: от 500 ₽" required />
              </div>
              <div>
                <label className="sakh-caption block mb-2">Возрастное ограничение</label>
                <select className="sakh-select">
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
              <input type="url" className="sakh-input" placeholder="https://example.com/image.jpg" />
            </div>

            <div>
              <label className="sakh-caption block mb-2">Контактный телефон</label>
              <input type="tel" className="sakh-input" placeholder="+7 (XXX) XXX-XX-XX" />
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
