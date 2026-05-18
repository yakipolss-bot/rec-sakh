import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, MapPin, Globe, Share2, Key, Shield, FileText,
  Save, Upload, Eye, EyeOff,
} from 'lucide-react';
import { sakhalinCities, serverLogs } from '@/data/adminMock';

const tabs = [
  { id: 'main', label: 'Основные', icon: Settings },
  { id: 'regions', label: 'Регионы', icon: MapPin },
  { id: 'seo', label: 'SEO', icon: Globe },
  { id: 'social', label: 'Соцсети', icon: Share2 },
  { id: 'api', label: 'API-ключи', icon: Key },
  { id: 'backup', label: 'Бэкап', icon: Shield },
  { id: 'logs', label: 'Логи', icon: FileText },
];

const cityNames: Record<string, boolean> = Object.fromEntries(
  sakhalinCities.map(c => [c, true])
);

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('main');
  const [activeCities, setActiveCities] = useState(cityNames);
  const [showApi, setShowApi] = useState<Record<string, boolean>>({});

  const toggleCity = (city: string) => {
    setActiveCities(prev => ({ ...prev, [city]: !prev[city] }));
  };

  return (
    <div className="space-y-6">
      <h1 className="sakh-heading">Настройки</h1>

      <div className="sakh-tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`sakh-tabs__item flex items-center gap-2 ${activeTab === tab.id ? 'sakh-tabs__item--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'main' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
            <div>
              <label className="sakh-caption block mb-1">Название сайта</label>
              <input type="text" className="sakh-input" defaultValue="Сахалинский портал" />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Логотип (URL)</label>
              <div className="flex gap-2">
                <input type="text" className="sakh-input" defaultValue="/logo.svg" />
                <button className="sakh-btn sakh-btn--secondary sakh-btn--sm"><Upload size={14} /> Загрузить</button>
              </div>
            </div>
            <div>
              <label className="sakh-caption block mb-1">Favicon (URL)</label>
              <div className="flex gap-2">
                <input type="text" className="sakh-input" defaultValue="/favicon.ico" />
                <button className="sakh-btn sakh-btn--secondary sakh-btn--sm"><Upload size={14} /> Загрузить</button>
              </div>
            </div>
            <div>
              <label className="sakh-caption block mb-1">Тема оформления</label>
              <select className="sakh-select">
                <option>default (Night)</option>
                <option>morning</option>
                <option>day</option>
                <option>evening</option>
                <option>focus</option>
                <option>night</option>
              </select>
            </div>
            <div>
              <label className="sakh-caption block mb-1">Meta Description</label>
              <textarea className="sakh-textarea" defaultValue="Новости Сахалина, объявления, погода, карты. Актуальная информация о жизни на острове." rows={3} />
            </div>
            <button className="sakh-btn sakh-btn--primary sakh-btn--md"><Save size={14} /> Сохранить</button>
          </motion.div>
        )}

        {activeTab === 'regions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="sakh-caption mb-4">Включите активные города для отображения на сайте</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sakhalinCities.map((city, i) => (
                <motion.button
                  key={city}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => toggleCity(city)}
                  className={`sakh-card sakh-card--compact text-left cursor-pointer flex items-center gap-2 ${activeCities[city] ? '!border-[var(--accent-ocean)]' : 'opacity-60'}`}
                >
                  <MapPin size={14} className={activeCities[city] ? 'text-[var(--accent-ocean)]' : 'text-[var(--text-muted)]'} />
                  <span className="text-sm font-mono">{city}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'seo' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
            <div>
              <label className="sakh-caption block mb-1">Meta Title</label>
              <input type="text" className="sakh-input" defaultValue="Сахалинский портал — новости, объявления, погода" />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Meta Description</label>
              <textarea className="sakh-textarea" defaultValue="Новости Сахалина, объявления, погода, карты. Актуальная информация о жизни на острове." rows={3} />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Robots.txt</label>
              <textarea className="sakh-textarea font-mono text-xs" defaultValue="User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/" rows={5} />
            </div>
            <button className="sakh-btn sakh-btn--primary sakh-btn--md"><Save size={14} /> Сохранить</button>
          </motion.div>
        )}

        {activeTab === 'social' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
            <div>
              <label className="sakh-caption block mb-1">Telegram (URL)</label>
              <input type="url" className="sakh-input" defaultValue="https://t.me/recsakh" placeholder="https://t.me/..." />
            </div>
            <div>
              <label className="sakh-caption block mb-1">ВКонтакте (URL)</label>
              <input type="url" className="sakh-input" defaultValue="https://vk.com/recsakh" placeholder="https://vk.com/..." />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Яндекс.Дзен (URL)</label>
              <input type="url" className="sakh-input" defaultValue="https://dzen.ru/recsakh" placeholder="https://dzen.ru/..." />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Одноклассники (URL)</label>
              <input type="url" className="sakh-input" defaultValue="https://ok.ru/recsakh" placeholder="https://ok.ru/..." />
            </div>
            <button className="sakh-btn sakh-btn--primary sakh-btn--md"><Save size={14} /> Сохранить</button>
          </motion.div>
        )}

        {activeTab === 'api' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
            {[
              { label: 'Погода (OpenWeatherMap)', key: 'weather', value: 'sk_live_xxxxxxxxxxxxxxxx' },
              { label: 'Валюты (ExchangeRate)', key: 'currency', value: 'sk_live_yyyyyyyyyyyyyyyy' },
              { label: 'Карты (Yandex Maps)', key: 'maps', value: 'sk_live_zzzzzzzzzzzzzzzz' },
            ].map(field => (
              <div key={field.key}>
                <label className="sakh-caption block mb-1">{field.label}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApi[field.key] ? 'text' : 'password'}
                      className="sakh-input !pr-10"
                      defaultValue={field.value}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApi(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showApi[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button className="sakh-btn sakh-btn--primary sakh-btn--md"><Save size={14} /> Сохранить</button>
          </motion.div>
        )}

        {activeTab === 'backup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Последний бэкап</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">16 мая 2026, 04:00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Размер</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">1.4 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Статус</span>
                <span className="sakh-tag sakh-tag--accent">Успешно</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md"><Shield size={14} /> Создать бэкап</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Уровень</th>
                    <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Сообщение</th>
                    <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Время</th>
                  </tr>
                </thead>
                <tbody>
                  {serverLogs.map((log, i) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-[var(--border-subtle)]"
                    >
                      <td className="py-3 px-3">
                        <span className={`sakh-tag ${log.level === 'error' ? 'sakh-tag--sunset' : log.level === 'warn' ? 'sakh-tag--outline' : 'sakh-tag--muted'}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{log.message}</td>
                      <td className="py-3 px-3 font-mono text-xs text-[var(--text-muted)]">{log.timestamp}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
