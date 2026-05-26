import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X } from 'lucide-react';
import adsService from '@/services/ads.service';
import { useUser } from '@/hooks/useUser';
import EmptyState from '@/components/EmptyState';
import type { Ad } from '@/models/ads/Ad';
import { toast } from 'sonner';

type TabId = 'list' | 'create';

export default function AccountAds() {
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const { user } = useUser();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await adsService.getAll({ perPage: 50, sort: 'createdAt' });
        if (!cancelled) {
          const items = res.data || [];
          setAds(items);
        }
      } catch {
        toast.error('Ошибка загрузки объявлений');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sakh-tabs mb-4">
        <button
          onClick={() => setActiveTab('list')}
          className={`sakh-tabs__item flex items-center gap-2 ${activeTab === 'list' ? 'sakh-tabs__item--active' : ''}`}
        >
          <FileText size={14} />
          Все объявления
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`sakh-tabs__item flex items-center gap-2 ${activeTab === 'create' ? 'sakh-tabs__item--active' : ''}`}
        >
          <Plus size={14} />
          Подать объявление
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'list' && (
            loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
              </div>
            ) : ads.length === 0 ? (
              <EmptyState title="Нет объявлений" description="Подайте первое объявление" icon={<FileText size={48} />} />
            ) : (
              <div className="space-y-3">
                {ads.map(ad => (
                  <div key={ad.id} className="sakh-card p-4 flex items-start gap-4">
                    {ad.images?.[0] && (
                      <img src={ad.images[0]} alt="" className="w-20 h-20 object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">{ad.title}</h4>
                      <p className="text-sm text-[var(--accent-ocean)] font-mono font-medium">
                        {ad.price ? `${ad.price} ₽` : 'Цена не указана'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="sakh-meta text-xs">{ad.city || ''}</span>
                        <span className={`sakh-tag text-xs ${ad.status === 'active' ? 'sakh-tag--accent' : ''}`}>
                          {ad.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'create' && (
            <div className="sakh-card p-4 sm:p-5">
              <p className="sakh-meta text-sm">Форма подачи объявления будет доступна после доработки модуля.</p>
              <p className="sakh-meta text-xs mt-2">Пока вы можете просматривать и управлять объявлениями на основной странице каталога.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
