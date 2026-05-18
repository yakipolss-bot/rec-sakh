import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import EmptyState from '@/components/EmptyState';

type TabId = 'all' | 'drafts' | 'liked';

const tabs: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'drafts', label: 'Черновики' },
  { id: 'liked', label: 'Лайкнутые' },
];

const userComments = [
  { id: 'uc1', text: 'Отличная новость! Наконец-то начали ремонт дороги.', articleTitle: 'В Южно-Сахалинске начался ремонт дороги на улице Ленина', articleSlug: 'novyy-torgovyy-tsentr-v-yuzhno-sakhalinske', date: '2026-05-15T10:30:00+11:00', likes: 5 },
  { id: 'uc2', text: 'Когда будет готово? Очень жду открытия.', articleTitle: 'Паромное сообщение Ванино-Холмск: новое расписание на лето', articleSlug: 'paromnoe-soobshchenie-vanino-kholmsk-raspisanie', date: '2026-05-14T15:20:00+11:00', likes: 3 },
  { id: 'uc3', text: 'Сахалин вперёд! Надеюсь на победу в этом сезоне.', articleTitle: '«Сахалин» стартовал в футбольной Лиге Востока с победы', articleSlug: 'sakhalin-startoval-v-futbolnoy-lige-vostoka', date: '2026-05-13T20:00:00+11:00', likes: 8 },
];

export default function AccountComments() {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const getContent = () => {
    if (activeTab === 'all') {
      return userComments.length > 0 ? (
        <div className="space-y-3">
          {userComments.map(comment => (
            <div key={comment.id} className="sakh-card p-4">
              <p className="text-sm leading-relaxed mb-3 text-[var(--text-primary)]">
                {comment.text}
              </p>
              <div className="flex items-center justify-between">
                <Link
                  to={`/news/${comment.articleSlug}`}
                  className="sakh-link text-sm line-clamp-1 flex-1 mr-4"
                >
                  {comment.articleTitle}
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="sakh-meta sakh-meta--with-icon">
                    <Heart size={10} />
                    {comment.likes}
                  </span>
                  <span className="sakh-meta">
                    {format(new Date(comment.date), 'd MMM', { locale: ru })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sakh-tabs mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`sakh-tabs__item ${activeTab === tab.id ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'all' && userComments.length > 0 ? (
            <div className="space-y-3">
              {userComments.map(comment => (
                <div key={comment.id} className="sakh-card p-4">
                  <p className="text-sm leading-relaxed mb-3 text-[var(--text-primary)]">
                    {comment.text}
                  </p>
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/news/${comment.articleSlug}`}
                      className="sakh-link text-sm line-clamp-1 flex-1 mr-4"
                    >
                      {comment.articleTitle}
                    </Link>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="sakh-meta sakh-meta--with-icon">
                        <Heart size={10} />
                        {comment.likes}
                      </span>
                      <span className="sakh-meta">
                        {format(new Date(comment.date), 'd MMM', { locale: ru })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                activeTab === 'all' ? 'Нет комментариев' :
                activeTab === 'drafts' ? 'Нет черновиков' : 'Нет лайкнутых'
              }
              description={
                activeTab === 'all' ? 'Вы ещё не оставили комментариев' :
                activeTab === 'drafts' ? 'Черновиков пока нет' : 'Вы ещё не лайкали комментарии'
              }
              icon={<MessageSquare size={48} />}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
