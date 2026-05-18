import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap, Eye, MessageSquare, TrendingUp,
  Play, Camera, BarChart3, Sun, ChevronRight,
} from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import BentoGrid from '@/components/BentoGrid';
import type { BentoItem } from '@/components/BentoGrid';
import WeatherWidget from '@/components/WeatherWidget';
import CurrencyWidget from '@/components/CurrencyWidget';
import EventsWidget from '@/components/EventsWidget';
import { newsArticles } from '@/data/mock';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const pollData = {
  question: 'Как вы оцениваете работу общественного транспорта в Южно-Сахалинске?',
  options: [
    { id: 'a', label: 'Отлично' },
    { id: 'b', label: 'Хорошо' },
    { id: 'c', label: 'Удовлетворительно' },
    { id: 'd', label: 'Плохо' },
  ],
};

const themeData = {
  tag: 'Городская среда',
  articles: newsArticles.filter(a => ['n2', 'n8', 'n12'].includes(a.id)),
};

export default function HomePage() {
  const heroArticles = newsArticles.slice(0, 3);
  const bentoNews = newsArticles.slice(3, 11);
  const popularNews = useMemo(
    () => [...newsArticles].sort((a, b) => b.views - a.views).slice(0, 5),
    [],
  );
  const videoArticle = newsArticles[0];
  const photoArticle = newsArticles[4];

  const [pollVoted, setPollVoted] = useState(false);
  const [pollSelected, setPollSelected] = useState<string | null>(null);
  const [pollResults] = useState<Record<string, number>>({
    a: 35, b: 28, c: 22, d: 15,
  });

  const totalVotes = Object.values(pollResults).reduce((a, b) => a + b, 0);

  const handleVote = () => {
    if (!pollSelected) return;
    setPollVoted(true);
  };

  const bentoItems: BentoItem[] = bentoNews.map((article, i) => ({
    id: article.id,
    type: i === 0 ? 'wide' : 'default',
    content: <NewsCard key={article.id} article={article} index={i} />,
  }));

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* Section 1: Hero */}
        <section className="mb-12" aria-label="Главные новости">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          >
            <motion.div variants={itemVariants} className="lg:col-span-7">
              <article className="sakh-card group cursor-pointer h-full flex flex-col">
                <Link to={`/news/${heroArticles[0].slug}`} className="flex flex-col h-full" aria-label={heroArticles[0].title}>
                  <div className="relative aspect-[16/9] lg:aspect-[16/10] overflow-hidden">
                    <img
                      src={heroArticles[0].mainImageUrl || ''}
                      alt={heroArticles[0].title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                    />
                    {heroArticles[0].isUrgent && (
                      <div className="absolute top-4 left-4 sakh-tag bg-[var(--accent-sunset)] text-white flex items-center gap-1.5">
                        <Zap size={12} />
                        Срочно
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="sakh-meta sakh-meta--accent">{heroArticles[0].category.name}</span>
                      <span className="sakh-meta">{heroArticles[0].city}</span>
                    </div>
                    <h1 className="sakh-display mb-3 line-clamp-3">{heroArticles[0].title}</h1>
                    <p className="sakh-body mb-4 line-clamp-2">{heroArticles[0].lead}</p>
                    <div className="mt-auto flex items-center gap-4">
                      <span className="sakh-meta sakh-meta--with-icon">
                        <Eye size={12} />
                        {heroArticles[0].views.toLocaleString('ru-RU')}
                      </span>
                      <span className="sakh-meta sakh-meta--with-icon">
                        <MessageSquare size={12} />
                        {heroArticles[0].commentsCount}
                      </span>
                      <span className="sakh-meta">{heroArticles[0].readingTimeMinutes} мин</span>
                    </div>
                  </div>
                </Link>
              </article>
            </motion.div>

            <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-4">
              {heroArticles.slice(1, 3).map((article, i) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 * (i + 1) }}
                  className="sakh-card group cursor-pointer flex-1"
                >
                  <Link to={`/news/${article.slug}`} className="flex flex-col sm:flex-row h-full" aria-label={article.title}>
                    <div className="sm:w-2/5 shrink-0 overflow-hidden">
                      <img
                        src={article.mainImageUrl || ''}
                        alt={article.title}
                        className="w-full h-full object-cover aspect-video sm:aspect-auto transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="sakh-meta sakh-meta--accent">{article.category.name}</span>
                      </div>
                      <h3 className="text-base font-medium leading-snug line-clamp-3 mb-2 flex-1 text-[var(--text-primary)]">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-auto">
                        <span className="sakh-meta sakh-meta--with-icon">
                          <Eye size={10} />
                          {article.views.toLocaleString('ru-RU')}
                        </span>
                        <span className="sakh-meta sakh-meta--with-icon">
                          <MessageSquare size={10} />
                          {article.commentsCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Section 2: Bento Grid + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <section className="lg:col-span-8" aria-label="Лента новостей">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="sakh-heading">Лента новостей</h2>
                <Link to="/category/obshchestvo" className="sakh-link text-sm flex items-center gap-1">
                  Все новости <ChevronRight size={14} />
                </Link>
              </div>
              <BentoGrid items={bentoItems} />
            </motion.div>
          </section>

          <aside className="lg:col-span-4 space-y-4" aria-label="Боковая панель">
            <WeatherWidget />
            <CurrencyWidget />
            <EventsWidget />

            <div className="sakh-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[var(--accent-ocean)]" />
                <h3 className="sakh-caption">Популярное</h3>
              </div>
              <div className="space-y-3">
                {popularNews.map((article, i) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.slug}`}
                    className="group flex gap-3 items-start focus-ring"
                    aria-label={`${i + 1}. ${article.title}`}
                  >
                    <span className="text-lg font-mono font-medium shrink-0 w-6 text-[var(--accent-ocean)]">{i + 1}</span>
                    <div>
                      <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-[var(--accent-ocean)] transition-colors text-[var(--text-primary)]">
                        {article.title}
                      </h4>
                      <span className="sakh-meta">{article.views.toLocaleString('ru-RU')} просмотров</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Section 3: Video of the Day */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-12"
          aria-label="Видео дня"
        >
          <div className="flex items-center gap-2 mb-6">
            <Play size={20} className="text-[var(--accent-ocean)]" />
            <h2 className="sakh-heading">Видео дня</h2>
          </div>
          <div className="sakh-card overflow-hidden">
            <Link to={`/news/${videoArticle.slug}`} className="block group" aria-label={videoArticle.title}>
              <div className="relative aspect-video bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden">
                <img
                  src={videoArticle.mainImageUrl || ''}
                  alt={videoArticle.title}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[var(--accent-ocean)]/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-[var(--accent-ocean)]/30 transition-all duration-300">
                    <Play size={32} className="text-[var(--accent-ocean)] ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[var(--bg-primary)]/90 to-transparent">
                  <h3 className="sakh-title text-white line-clamp-2">{videoArticle.title}</h3>
                  <p className="sakh-meta text-white/70 mt-1">{videoArticle.lead}</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.section>

        {/* Section 4: Photo of the Day */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-12"
          aria-label="Фото дня"
        >
          <div className="flex items-center gap-2 mb-6">
            <Camera size={20} className="text-[var(--accent-ocean)]" />
            <h2 className="sakh-heading">Фото дня</h2>
          </div>
          <div className="sakh-card overflow-hidden group">
            <Link to={`/news/${photoArticle.slug}`} className="block" aria-label={photoArticle.title}>
              <div className="overflow-hidden">
                <img
                  src={photoArticle.mainImageUrl || ''}
                  alt={photoArticle.title}
                  className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="sakh-title mb-2">{photoArticle.title}</h3>
                <div className="flex items-center gap-4 sakh-meta">
                  <span>{photoArticle.city}</span>
                  <span>{photoArticle.author.name}</span>
                  <span>{new Date(photoArticle.publishedAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </Link>
          </div>
        </motion.section>

        {/* Section 5: Poll of the Day */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="mb-12"
          aria-label="Опрос дня"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={20} className="text-[var(--accent-ocean)]" />
            <h2 className="sakh-heading">Опрос дня</h2>
          </div>
          <div className="sakh-card p-6">
            <h3 className="sakh-title mb-6">{pollData.question}</h3>
            <div className="space-y-3">
              {pollData.options.map((option) => {
                const percentage = pollVoted ? Math.round((pollResults[option.id] / totalVotes) * 100) : 0;
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 ${
                      pollVoted ? '' : 'hover:bg-[var(--accent-ocean-20)]'
                    } ${pollSelected === option.id && !pollVoted ? 'bg-[var(--accent-ocean-20)]' : ''} ${
                      pollVoted ? 'border-l-[3px] border-[var(--accent-ocean)]' : 'border-l-[3px] border-transparent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="poll"
                      value={option.id}
                      checked={pollSelected === option.id}
                      onChange={() => setPollSelected(option.id)}
                      disabled={pollVoted}
                      className="sakh-radio"
                      aria-label={option.label}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[var(--text-primary)]">{option.label}</span>
                        {pollVoted && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-sm font-mono font-medium text-[var(--accent-ocean)]"
                          >
                            {percentage}%
                          </motion.span>
                        )}
                      </div>
                      {pollVoted && (
                        <div className="mt-2 sakh-progress">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="sakh-progress__bar"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            {!pollVoted && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVote}
                disabled={!pollSelected}
                className="sakh-btn sakh-btn--primary sakh-btn--md mt-6"
                aria-label="Проголосовать"
              >
                Проголосовать
              </motion.button>
            )}
            {pollVoted && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="sakh-meta mt-4"
              >
                Всего голосов: {totalVotes}
              </motion.p>
            )}
          </div>
        </motion.section>

        {/* Section 6: Theme of the Day */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          aria-label="Тема дня"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sun size={20} className="text-[var(--accent-ocean)]" />
            <h2 className="sakh-heading">Тема дня</h2>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="sakh-tag sakh-tag--accent">{themeData.tag}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {themeData.articles.map((article, i) => (
              <NewsCard key={article.id} article={article} variant="compact" index={i} />
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
