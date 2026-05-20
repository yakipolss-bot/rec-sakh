import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Image, Building2 } from 'lucide-react';
import { newsService } from '@/services/news.service';
import { useFavorites } from '@/hooks/useFavorites';
import NewsCard from '@/components/NewsCard';
import EmptyState from '@/components/EmptyState';
import type { NewsArticle } from '@/types';

type TabId = 'news' | 'photos' | 'directory';

const tabs: { id: TabId; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'news', label: 'Новости', icon: Bookmark },
  { id: 'photos', label: 'Фото', icon: Image },
  { id: 'directory', label: 'Организации', icon: Building2 },
];

export default function AccountFavorites() {
  const [activeTab, setActiveTab] = useState<TabId>('news');
  const { favorites } = useFavorites();
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await newsService.getNews();
        if (!cancelled) setAllNews(res.data || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  const favoriteArticles = allNews.filter(a => favorites.includes(a.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sakh-tabs mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sakh-tabs__item flex items-center gap-2 ${activeTab === tab.id ? 'sakh-tabs__item--active' : ''}`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'news' && (
            loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
              </div>
            ) : favoriteArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteArticles.map((article, i) => (
                  <NewsCard key={article.id} article={article} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Нет сохранённых новостей"
                description="Нажмите на иконку закладки на любой новости, чтобы сохранить её"
                icon={<Bookmark size={48} />}
              />
            )
          )}

          {activeTab === 'photos' && (
            <EmptyState
              title="Нет сохранённых фото"
              description="Фотогалерея пока пуста"
              icon={<Image size={48} />}
            />
          )}

          {activeTab === 'directory' && (
            <EmptyState
              title="Нет сохранённых организаций"
              description="Сохраняйте организации, чтобы они появились здесь"
              icon={<Building2 size={48} />}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
