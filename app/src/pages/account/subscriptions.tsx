import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Bookmark, Tag, User, Key } from 'lucide-react';
import { categories } from '@/data/mock';
import { useUserSubscriptions } from '@/hooks/useUser';
import { usersService } from '@/services/users.service';
import { toast } from 'sonner';
import EmptyState from '@/components/EmptyState';

type TabId = 'categories' | 'tags' | 'authors' | 'keywords';

const tabs: { id: TabId; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'categories', label: 'Рубрики', icon: Bookmark },
  { id: 'tags', label: 'Теги', icon: Tag },
  { id: 'authors', label: 'Авторы', icon: User },
  { id: 'keywords', label: 'Ключевые слова', icon: Key },
];

const popularTags = ['шторм', 'спорт', 'транспорт', 'экономика', 'образование', 'медицина', 'экология', 'культура', 'происшествия', 'политика'];

export default function AccountSubscriptions() {
  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const { subscriptions, error, refetch } = useUserSubscriptions();
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>([]);
  const [subscribedTags, setSubscribedTags] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const cats = subscriptions.filter(s => s.type === 'category').map(s => s.value);
      const tags = subscriptions.filter(s => s.type === 'keyword').map(s => s.value);
      setSubscribedCategories(cats);
      setSubscribedTags(tags);
    }
  }, [subscriptions]);

  const toggleCategory = async (name: string) => {
    try {
      setIsSaving(true);
      const isSubscribed = subscribedCategories.includes(name);
      if (isSubscribed) {
        const sub = subscriptions?.find(s => s.type === 'category' && s.value === name);
        if (sub) await usersService.removeSubscription(sub.id);
      } else {
        await usersService.addSubscription('category', name);
      }
      refetch?.();
      toast.success(isSubscribed ? 'Подписка отменена' : 'Подписка добавлена');
    } catch (err) {
      toast.error('Ошибка при изменении подписки');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTag = async (tag: string) => {
    try {
      setIsSaving(true);
      const isSubscribed = subscribedTags.includes(tag);
      if (isSubscribed) {
        const sub = subscriptions?.find(s => s.type === 'keyword' && s.value === tag);
        if (sub) await usersService.removeSubscription(sub.id);
      } else {
        await usersService.addSubscription('keyword', tag);
      }
      refetch?.();
      toast.success(isSubscribed ? 'Подписка отменена' : 'Подписка добавлена');
    } catch (err) {
      toast.error('Ошибка при изменении подписки');
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyword = async () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !subscribedTags.includes(kw)) {
      try {
        setIsSaving(true);
        await usersService.addSubscription('keyword', kw);
        refetch?.();
        setKeywordInput('');
        toast.success('Ключевое слово добавлено');
      } catch (err) {
        toast.error('Ошибка при добавлении ключевого слова');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const removeKeyword = async (kw: string) => {
    try {
      setIsSaving(true);
      const sub = subscriptions?.find(s => s.type === 'keyword' && s.value === kw);
      if (sub) await usersService.removeSubscription(sub.id);
      refetch?.();
      toast.success('Ключевое слово удалено');
    } catch (err) {
      toast.error('Ошибка при удалении ключевого слова');
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="sakh-card p-4 text-center">
        <p className="text-[var(--accent-sunset)]">Ошибка загрузки подписок</p>
        <button onClick={() => window.location.reload()} className="sakh-btn sakh-btn--sm mt-4">
          Перезагрузить
        </button>
      </div>
    );
  }

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
          {activeTab === 'categories' && (
            <div className="sakh-card p-4 space-y-1">
              {categories.map(cat => {
                const subscribed = subscribedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.name)}
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-sm border-l-2 transition-colors ${
                      subscribed
                        ? 'text-[var(--accent-ocean)] border-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]'
                        : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`w-4 h-4 border transition-colors ${
                      subscribed
                        ? 'bg-[var(--accent-ocean)] border-[var(--accent-ocean)]'
                        : 'border-[var(--border-color)]'
                    }`} />
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div className="sakh-search">
                <Search size={16} className="sakh-search__icon" />
                <input
                  type="text"
                  placeholder="Поиск тегов..."
                  className="sakh-search__input"
                />
              </div>
              <div className="sakh-card p-4">
                <p className="sakh-caption mb-3">Популярные теги</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => {
                    const subscribed = subscribedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`sakh-tag transition-colors cursor-pointer ${
                          subscribed ? 'sakh-tag--accent' : 'sakh-tag--outline hover:border-[var(--accent-ocean)] hover:text-[var(--accent-ocean)]'
                        }`}
                      >
                        {tag}
                        {subscribed && <X size={10} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {subscribedTags.length > 0 && (
                <div className="sakh-card p-4">
                  <p className="sakh-caption mb-3">Мои теги ({subscribedTags.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {subscribedTags.map(tag => (
                      <span key={tag} className="sakh-tag sakh-tag--accent">
                        {tag}
                        <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-[var(--accent-sunset)]" disabled={isSaving}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'authors' && (
            <div className="space-y-2">
              <EmptyState title="Авторы" description="Авторы пока недоступны для подписки" icon={<User size={48} />} />
            </div>
          )}

          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="sakh-card p-4">
                <label className="sakh-caption block mb-2">Добавить ключевое слово</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addKeyword()}
                    placeholder="Введите слово..."
                    className="sakh-input flex-1"
                    disabled={isSaving}
                  />
                  <button onClick={addKeyword} className="sakh-btn sakh-btn--primary sakh-btn--sm disabled:opacity-50" disabled={isSaving}>
                    <Plus size={14} />
                    Добавить
                  </button>
                </div>
              </div>
              {subscribedTags.length > 0 ? (
                <div className="sakh-card p-4">
                  <p className="sakh-caption mb-3">Ключевые слова ({subscribedTags.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {subscribedTags.map(kw => (
                      <span key={kw} className="sakh-tag sakh-tag--accent">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="ml-1 hover:text-[var(--accent-sunset)]" disabled={isSaving}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState title="Нет ключевых слов" description="Добавьте слова для умного оповещения" icon={<Key size={48} />} />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
