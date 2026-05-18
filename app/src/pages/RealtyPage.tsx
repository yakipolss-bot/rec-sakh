import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Maximize2, Home, Layers } from 'lucide-react';
import FilterBar from '@/components/FilterBar';

const REALTY_CITIES = [
  { value: 'yuzhno', label: 'Южно-Сахалинск' },
  { value: 'korsakov', label: 'Корсаков' },
  { value: 'kholmsk', label: 'Холмск' },
  { value: 'nevelsk', label: 'Невельск' },
  { value: 'aniva', label: 'Анива' },
];

const HOUSE_TYPES = [
  { value: 'panel', label: 'Панельный' },
  { value: 'brick', label: 'Кирпичный' },
  { value: 'monolith', label: 'Монолитный' },
  { value: 'wood', label: 'Деревянный' },
];

interface RealtyItem {
  id: string;
  title: string;
  address: string;
  price: string;
  rooms: number;
  area: string;
  floor: string;
  type: string;
  image: string;
  mode: string;
}

const mockRealty: RealtyItem[] = [
  { id: 'r1', title: '2-комнатная квартира, центр', address: 'ул. Ленина, 42', price: '6 500 000 ₽', rooms: 2, area: '54 м²', floor: '5/9', type: 'panel', image: '/images/news-city.jpg', mode: 'sale' },
  { id: 'r2', title: 'Сдам 1-комнатную квартиру', address: 'пр. Мира, 15', price: '30 000 ₽/мес', rooms: 1, area: '32 м²', floor: '3/5', type: 'brick', image: '/images/news-city.jpg', mode: 'rent' },
  { id: 'r3', title: 'Новостройка, студия 25 м²', address: 'ул. Сахалинская, 7', price: '4 200 000 ₽', rooms: 1, area: '25 м²', floor: '12/16', type: 'monolith', image: '/images/news-city.jpg', mode: 'newbuild' },
  { id: 'r4', title: '3-комнатная, улучшенная планировка', address: 'ул. Чехова, 10', price: '8 200 000 ₽', rooms: 3, area: '72 м²', floor: '4/9', type: 'brick', image: '/images/news-city.jpg', mode: 'sale' },
  { id: 'r5', title: 'Дом в пригороде 120 м²', address: 'с. Дальнее, ул. Лесная, 3', price: '5 500 000 ₽', rooms: 4, area: '120 м²', floor: '1/2', type: 'wood', image: '/images/news-city.jpg', mode: 'sale' },
  { id: 'r6', title: 'Аренда 2-комнатной, центр', address: 'ул. Коммунистическая, 8', price: '40 000 ₽/мес', rooms: 2, area: '48 м²', floor: '2/5', type: 'panel', image: '/images/news-city.jpg', mode: 'rent' },
];

const MODE_OPTIONS = [
  { value: 'sale', label: 'Продажа' },
  { value: 'rent', label: 'Аренда' },
  { value: 'newbuild', label: 'Новостройки' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function RealtyPage() {
  const [mode, setMode] = useState('sale');
  const [city, setCity] = useState<string | null>(null);

  let filtered = mockRealty.filter(r => r.mode === mode);
  if (city) {
    const cityName = REALTY_CITIES.find(c => c.value === city)?.label || '';
    filtered = filtered.filter(r => r.address.includes(cityName));
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
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Недвижимость</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Недвижимость</h1>
          <p className="sakh-body">Квартиры, дома, новостройки на Сахалине</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          {MODE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={mode === opt.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <FilterBar options={REALTY_CITIES} selected={city} onChange={setCity} allLabel="Все города" />
        </div>

        <motion.div
          key={`${mode}-${city}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((item) => (
            <motion.div key={item.id} variants={cardVariants}>
              <div className="sakh-card group cursor-pointer h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="sakh-tag sakh-tag--accent">
                      {MODE_OPTIONS.find(m => m.value === mode)?.label}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="sakh-title line-clamp-1 mb-1">{item.title}</h3>
                  <div className="sakh-meta sakh-meta--with-icon mb-2">
                    <MapPin size={10} />
                    {item.address}
                  </div>
                  <div className="text-xl font-mono font-bold text-[var(--accent-ocean)] mb-3">{item.price}</div>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Home size={14} />
                      {item.rooms} комн.
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize2 size={14} />
                      {item.area}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers size={14} />
                      {item.floor}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
