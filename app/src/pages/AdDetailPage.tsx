import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Clock, Eye, Phone, Share2, Heart } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  price: string;
  city: string;
  date: string;
  category: string;
  views: number;
  image: string;
  description: string;
  phone: string;
}

const mockAds: Record<string, Ad> = {
  'a1': {
    id: 'a1', title: 'Продам Toyota Camry 2020', price: '2 800 000 ₽',
    city: 'Южно-Сахалинск', date: '16 мая', category: 'Авто',
    views: 234, image: '/images/news-city.jpg',
    description: 'Продаю Toyota Camry 2020 года выпуска. Состояние отличное, один хозяин. Цвет белый, двигатель 2.5 литра, коробка автомат. Комплектация Люкс: кожаный салон, подогрев сидений, люк, камера заднего вида, парктроники. Пробег 45 000 км. Регулярное обслуживание у официального дилера. Торг уместен.',
    phone: '+7 (962) 123-45-67',
  },
};

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ad = id ? mockAds[id] : undefined;

  if (!ad) {
    return (
      <div className="pt-20 pb-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="sakh-empty">
            <h1 className="sakh-empty__title">Объявление не найдено</h1>
            <Link to="/ads" className="sakh-btn sakh-btn--primary sakh-btn--md">К объявлениям</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <Link to="/ads" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">Объявления</Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">{ad.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="sakh-card overflow-hidden mb-6">
                <img src={ad.image} alt={ad.title} className="w-full aspect-[16/9] object-cover" />
              </div>

              <div className="sakh-card p-6 mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="sakh-heading mb-2">{ad.title}</h1>
                    <span className="sakh-tag sakh-tag--accent">{ad.category}</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-[var(--accent-ocean)] shrink-0">
                    {ad.price}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4">
                  <span className="sakh-meta sakh-meta--with-icon">
                    <MapPin size={12} /> {ad.city}
                  </span>
                  <span className="sakh-meta sakh-meta--with-icon">
                    <Clock size={12} /> {ad.date}
                  </span>
                  <span className="sakh-meta sakh-meta--with-icon">
                    <Eye size={12} /> {ad.views} просмотров
                  </span>
                </div>

                <h2 className="sakh-title mb-3">Описание</h2>
                <div className="sakh-body leading-relaxed">{ad.description}</div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="sticky top-24 space-y-4"
            >
              <div className="sakh-card p-4">
                <h3 className="sakh-caption mb-3">Контакты</h3>
                <a href={`tel:${ad.phone}`} className="sakh-btn sakh-btn--primary sakh-btn--lg w-full mb-2">
                  <Phone size={16} />
                  {ad.phone}
                </a>
              </div>

              <div className="sakh-card p-4">
                <div className="flex gap-2">
                  <button className="sakh-btn sakh-btn--secondary sakh-btn--md flex-1">
                    <Heart size={16} /> В избранное
                  </button>
                  <button className="sakh-btn sakh-btn--ghost sakh-btn--md">
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
