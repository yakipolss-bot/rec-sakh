import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, X, Plus, Bookmark, Tag, User, Key } from 'lucide-react';
import { categories } from '@/data/mock';
import { authorSubscriptions, keywordSubscriptions } from '@/data/accountMock';
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
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>(['Общество', 'Спорт', 'Транспорт']);
  const [subscribedTags, setSubscribedTags] = useState<string[]>(['спорт', 'транспорт']);
  const [authors, setAuthors] = useState(authorSubscriptions);
  const [keywords, setKeywords] = useState(keywordSubscriptions.map(k => k.keyword));
  const [keywordInput, setKeywordInput] = useState('');

  const toggleCategory = (name: string) => {
    setSubscribedCategories(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const toggleTag = (tag: string) => {
    setSubscribedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleAuthor = (id: string) => {
    setAuthors(prev =>
      prev.map(a => a.id === id ? { ...a, subscribed: !a.subscribed } : a)
    );
  };

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords(prev => [...prev, kw]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
  };

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
                        <button onClick={() => toggleTag(tag)} className="ml-1 hover:text-[var(--accent-sunset)]">
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
              {authors.length > 0 ? authors.map(author => (
                <div key={author.id} className="sakh-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center text-sm font-mono uppercase bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                      {author.authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{author.authorName}</p>
                      <p className="sakh-meta text-xs">{author.authorRole}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAuthor(author.id)}
                    className={`sakh-btn sakh-btn--sm ${author.subscribed ? 'sakh-btn--primary' : 'sakh-btn--secondary'}`}
                  >
                    {author.subscribed ? 'Отписаться' : 'Подписаться'}
                  </button>
                </div>
              )) : (
                <EmptyState title="Нет авторов" description="Авторы пока недоступны для подписки" icon={<User size={48} />} />
              )}
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
                  />
                  <button onClick={addKeyword} className="sakh-btn sakh-btn--primary sakh-btn--sm">
                    <Plus size={14} />
                    Добавить
                  </button>
                </div>
              </div>
              {keywords.length > 0 ? (
                <div className="sakh-card p-4">
                  <p className="sakh-caption mb-3">Ключевые слова ({keywords.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map(kw => (
                      <span key={kw} className="sakh-tag sakh-tag--accent">
                        {kw}
                        <button onClick={() => removeKeyword(kw)} className="ml-1 hover:text-[var(--accent-sunset)]">
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
