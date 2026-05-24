import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Phone, MapPin, Star, X, Loader2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import directoryService from '@/services/directory.service';
import type { DirectoryOrg } from '@/models/directory/DirectoryOrg';

const DIR_CATEGORIES = [
  { value: 'restaurants', label: 'Рестораны', icon: '🍽️' },
  { value: 'shops', label: 'Магазины', icon: '🛒' },
  { value: 'medicine', label: 'Медицина', icon: '🏥' },
  { value: 'education', label: 'Образование', icon: '📚' },
  { value: 'services', label: 'Госуслуги', icon: '🏛️' },
  { value: 'transport', label: 'Транспорт', icon: '🚌' },
];

export default function DirectoryPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [orgs, setOrgs] = useState<DirectoryOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { perPage: '100' };
        if (search) params.search = search;
        const res = await directoryService.getAll(params);
        if (!cancelled) setOrgs(res.data || []);
      } catch {
        if (!cancelled) setOrgs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [search]);

  const filtered = category
    ? orgs.filter(o => o.category?.slug === category)
    : orgs;

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Справочник | Сахалин" description="Справочник организаций и услуг Сахалина." />
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-ocean)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">
            <p className="text-lg">Организации не найдены</p>
          </div>
        ) : (
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
                      {org.category && (
                        <span>{DIR_CATEGORIES.find(c => c.value === org.category!.slug)?.icon} {org.category.name}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {org.address || org.city || '—'}
                      </span>
                    </div>
                    {org.phone && (
                      <a href={`tel:${org.phone}`} className="sakh-meta sakh-meta--with-icon text-[var(--accent-ocean)] hover:underline">
                        <Phone size={12} />
                        {org.phone}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={14} className="text-[var(--accent-sunset)]" fill="var(--accent-sunset)" />
                    <span className="font-mono font-bold text-[var(--text-primary)]">{Number(org.avgRating).toFixed(1)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
