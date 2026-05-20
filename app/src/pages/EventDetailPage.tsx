import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function EventDetailPage() {
  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
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
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Событие</span>
        </nav>

        <div className="sakh-empty">
          <h1 className="sakh-empty__title">Событие не найдено</h1>
          <p className="sakh-empty__description">
            Модуль событий находится в разработке. Скоро здесь появятся концерты, спектакли и другие мероприятия Сахалина.
          </p>
          <Link to="/events" className="sakh-btn sakh-btn--primary sakh-btn--md">
            К афише
          </Link>
        </div>
      </div>
    </div>
  );
}
