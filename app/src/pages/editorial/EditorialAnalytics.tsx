import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, FileText, Users, Search, Activity,
  Eye, Clock, MousePointer, Globe,
} from 'lucide-react';

type Tab = 'traffic' | 'content' | 'authors' | 'search' | 'online';

const tabs: { value: Tab; label: string }[] = [
  { value: 'traffic', label: 'Трафик' },
  { value: 'content', label: 'Контент' },
  { value: 'authors', label: 'Авторы' },
  { value: 'search', label: 'Поиск' },
  { value: 'online', label: 'Онлайн' },
];

export default function EditorialAnalytics() {
  const [activeTab, setActiveTab] = useState<Tab>('traffic');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'traffic':
        return (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Eye, label: 'Визиты сегодня', value: '12 847' },
                { icon: Users, label: 'Уникальные', value: '8 231' },
                { icon: MousePointer, label: 'Ср. глубина', value: '3.2 стр' },
                { icon: Clock, label: 'Ср. время', value: '4:32 мин' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="sakh-card p-4"
                >
                  <stat.icon size={18} className="text-[var(--accent-ocean)] mb-2" />
                  <p className="text-xl font-bold font-mono text-[var(--text-primary)]">{stat.value}</p>
                  <p className="sakh-meta">{stat.label}</p>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="sakh-card p-4">
                <h3 className="sakh-caption text-[var(--text-secondary)] mb-3">Источники трафика</h3>
                {[
                  { source: 'Органический поиск', percent: 45 },
                  { source: 'Прямые заходы', percent: 25 },
                  { source: 'Социальные сети', percent: 18 },
                  { source: 'Переходы с сайтов', percent: 12 },
                ].map((item) => (
                  <div key={item.source} className="mb-2">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-[var(--text-secondary)]">{item.source}</span>
                      <span className="font-mono text-xs text-[var(--text-primary)]">{item.percent}%</span>
                    </div>
                    <div className="sakh-progress">
                      <div className="sakh-progress__bar" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="sakh-card p-4">
                <h3 className="sakh-caption text-[var(--text-secondary)] mb-3">География</h3>
                {[
                  { region: 'Сахалинская обл.', percent: 62 },
                  { region: 'Москва и МО', percent: 14 },
                  { region: 'Хабаровский край', percent: 8 },
                  { region: 'Приморский край', percent: 6 },
                  { region: 'Другие', percent: 10 },
                ].map((item) => (
                  <div key={item.region} className="mb-2">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-[var(--text-secondary)]">{item.region}</span>
                      <span className="font-mono text-xs text-[var(--text-primary)]">{item.percent}%</span>
                    </div>
                    <div className="sakh-progress">
                      <div className="sakh-progress__bar" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'content':
        return (
          <div className="sakh-card p-4">
            <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Топ материалов</h3>
            {['Штормовое предупреждение', 'Паромное сообщение', 'Новый ТЦ', 'Электробусы', 'ДТП на трассе'].map((title, i) => (
              <div key={title} className="flex items-center gap-3 py-2 border-b border-[var(--border-color)] last:border-0">
                <span className="sakh-meta sakh-meta--accent font-bold w-5">{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 text-sm text-[var(--text-primary)]">{title}</span>
                <span className="sakh-meta">{Math.floor(Math.random() * 10000 + 1000).toLocaleString('ru-RU')}</span>
              </div>
            ))}
          </div>
        );
      case 'authors':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-3 py-2 text-left sakh-caption">Автор</th>
                  <th className="px-3 py-2 text-left sakh-caption">Материалов</th>
                  <th className="px-3 py-2 text-left sakh-caption">Всего просмотров</th>
                  <th className="px-3 py-2 text-left sakh-caption">Ср. просмотров</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Анна Кузнецова', count: 3, views: 18956 },
                  { name: 'Иван Петров', count: 4, views: 38960 },
                  { name: 'Мария Соколова', count: 2, views: 19524 },
                  { name: 'Дмитрий Волков', count: 2, views: 12221 },
                  { name: 'Елена Морозова', count: 2, views: 7777 },
                  { name: 'Сергей Новиков', count: 1, views: 8765 },
                ].map((author) => (
                  <tr key={author.name} className="border-b border-[var(--border-color)]">
                    <td className="px-3 py-2 text-[var(--text-primary)]">{author.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{author.count}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{author.views.toLocaleString('ru-RU')}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{Math.round(author.views / author.count).toLocaleString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'search':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="sakh-card p-4">
              <h3 className="sakh-caption text-[var(--text-secondary)] mb-3">Часто ищут</h3>
              {['погода', 'афиша', 'работа', 'ДТП', 'вакансии'].map((q) => (
                <div key={q} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)] last:border-0">
                  <span className="text-sm text-[var(--text-primary)]">{q}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{Math.floor(Math.random() * 500 + 50)}</span>
                </div>
              ))}
            </div>
            <div className="sakh-card p-4">
              <h3 className="sakh-caption text-[var(--text-secondary)] mb-3">Не находят (нулевые результаты)</h3>
              {['погода оха завтра', 'расписание парома', 'новости курильск', 'телефон мэрии', 'билеты на самолёт'].map((q) => (
                <div key={q} className="flex items-center justify-between py-1.5 border-b border-[var(--border-color)] last:border-0">
                  <span className="text-sm text-[var(--accent-sunset)]">{q}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{Math.floor(Math.random() * 100 + 10)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'online':
        return (
          <div className="sakh-card p-6 text-center">
            <Activity size={48} className="mx-auto mb-4 text-[var(--accent-ocean)]" />
            <p className="text-4xl font-bold font-mono text-[var(--text-primary)] mb-2">247</p>
            <p className="sakh-body">пользователей онлайн сейчас</p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'Читают', value: 142 },
                { label: 'Комментируют', value: 18 },
                { label: 'Ищут', value: 87 },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-[var(--bg-surface)]">
                  <p className="text-lg font-mono font-bold text-[var(--accent-ocean)]">{item.value}</p>
                  <p className="sakh-meta">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <h1 className="sakh-heading mb-2">Аналитика</h1>
      <p className="sakh-meta mb-6">Статистика портала и активность пользователей</p>

      <div className="sakh-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`sakh-tabs__item ${activeTab === tab.value ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  );
}
