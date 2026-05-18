import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Phone, MapPin, Star, X } from 'lucide-react';

const DIR_CATEGORIES = [
  { value: 'restaurants', label: 'Рестораны', icon: '🍽️' },
  { value: 'shops', label: 'Магазины', icon: '🛒' },
  { value: 'medicine', label: 'Медицина', icon: '🏥' },
  { value: 'education', label: 'Образование', icon: '📚' },
  { value: 'services', label: 'Госуслуги', icon: '🏛️' },
  { value: 'transport', label: 'Транспорт', icon: '🚌' },
];

interface Organization {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  phone: string;
}

const mockOrgs: Organization[] = [
  { id: 'd1', name: 'Ресторан «Сахалин»', category: 'restaurants', address: 'ул. Ленина, 23', rating: 4.5, phone: '+7 (4242) 55-55-55' },
  { id: 'd2', name: 'ТЦ «Остров»', category: 'shops', address: 'ул. Сахалинская, 1', rating: 4.2, phone: '+7 (4242) 33-33-33' },
  { id: 'd3', name: 'Городская больница №1', category: 'medicine', address: 'пр. Мира, 10', rating: 3.8, phone: '+7 (4242) 44-44-44' },
  { id: 'd4', name: 'Школа №3', category: 'education', address: 'ул. Чехова, 5', rating: 4.0, phone: '+7 (4242) 22-22-22' },
  { id: 'd5', name: 'МФЦ «Мои документы»', category: 'services', address: 'ул. Пограничная, 19', rating: 4.1, phone: '+7 (4242) 11-11-11' },
  { id: 'd6', name: 'Автовокзал Южно-Сахалинска', category: 'transport', address: 'ул. Вокзальная, 3', rating: 3.5, phone: '+7 (4242) 66-66-66' },
  { id: 'd7', name: 'Кофейня «Берег»', category: 'restaurants', address: 'наб. Реки 1', rating: 4.7, phone: '+7 (4242) 77-77-77' },
  { id: 'd8', name: 'Аптека «Здоровье»', category: 'medicine', address: 'ул. Коммунистическая, 12', rating: 4.3, phone: '+7 (4242) 88-88-88' },
];

export default function DirectoryPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  let filtered = mockOrgs;
  if (category) filtered = filtered.filter(o => o.category === category);
  if (search) filtered = filtered.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Справочник</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Справочник организаций</h1>
          <p className="sakh-body">Организации и учреждения Южно-Сахалинска</p>
        </motion.div>

        <div className="mb-6">
          <div className="sakh-search">
            <Search size={16} className="sakh-search__icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sakh-search__input"
              placeholder="Поиск организаций..."
            />
            {search && (
              <button onClick={() => setSearch('')} className="sakh-search__clear">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCategory(null)}
            className={category === null ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
          >
            Все
          </button>
          {DIR_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={category === cat.value ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <motion.div
          key={`${category}-${search}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
          className="space-y-3"
        >
          {filtered.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="sakh-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="sakh-title mb-1">{org.name}</h3>
                  <div className="flex items-center gap-3 flex-wrap text-sm text-[var(--text-secondary)] mb-2">
                    <span>{DIR_CATEGORIES.find(c => c.value === org.category)?.icon} {DIR_CATEGORIES.find(c => c.value === org.category)?.label}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {org.address}
                    </span>
                  </div>
                  <a href={`tel:${org.phone}`} className="sakh-meta sakh-meta--with-icon text-[var(--accent-ocean)] hover:underline">
                    <Phone size={12} />
                    {org.phone}
                  </a>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star size={14} className="text-[var(--accent-sunset)]" fill="var(--accent-sunset)" />
                  <span className="font-mono font-bold text-[var(--text-primary)]">{org.rating}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
