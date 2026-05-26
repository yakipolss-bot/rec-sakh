import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Settings, MapPin, Globe, Share2, Key, Shield, FileText,
  Save, Upload, Eye, EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { ServerLog } from '@/models/admin/ServerLog';

const sakhalinCities = [
  'Южно-Сахалинск', 'Корсаков', 'Оха', 'Невельск', 'Холмск',
  'Поронайск', 'Долинск', 'Анива', 'Смирных', 'Томари',
  'Углегорск', 'Александровск-Сахалинский', 'Тымовское',
];

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
  const { section } = useParams();
  const sectionToTab: Record<string, string> = { general: 'main', regions: 'regions', seo: 'seo', social: 'social', api: 'api', backup: 'backup', logs: 'logs' };
  const [activeTab, setActiveTab] = useState((section && sectionToTab[section]) || 'main');

  useEffect(() => {
    if (section && sectionToTab[section]) setActiveTab(sectionToTab[section]);
  }, [section]);
  const [activeCities, setActiveCities] = useState(cityNames);
  const [showApi, setShowApi] = useState<Record<string, boolean>>({});

  const { data: settingsData } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const [settingsItems, auditData] = await Promise.all([
        adminService.getSettings(),
        adminService.getAuditLog({ perPage: 20 }),
      ]);
      const map: Record<string, unknown> = {};
      settingsItems.forEach((item: { key: string; value: unknown }) => { map[item.key] = item.value; });
      const logEntries: ServerLog[] = (auditData.data ?? []).map((log: any) => ({
        id: String(log.id ?? ''),
        level: 'info',
        message: `${String(log.action ?? '')}: ${String(log.target ?? '')}`,
        timestamp: String(log.timestamp ?? ''),
      }));
      return { settings: map, logEntries };
    },
  });

  const settings = (settingsData?.settings ?? {}) as Record<string, string>;
  const logEntries = settingsData?.logEntries ?? [];

  const toggleCity = (city: string) => {
    setActiveCities(prev => ({ ...prev, [city]: !prev[city] }));
  };

  const handleSave = async (el: HTMLElement, successMsg = 'Настройки сохранены') => {
    const inputs = el.querySelectorAll('input, textarea, select') as NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    try {
      for (const input of inputs) {
        if (input.name) {
          await adminService.updateSetting(input.name, input.value).catch(() => {});
        }
      }
      toast.success(successMsg);
    } catch {
      toast.error('Ошибка при сохранении');
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await adminService.uploadFile(file);
        toast.success('Файл загружен');
      } catch {
        toast.error('Ошибка при загрузке');
      }
    };
    input.click();
  };

  const handleBackup = async () => {
    try {
      await adminService.createBackup();
      toast.success('Бэкап создан');
    } catch {
      toast.error('Ошибка при создании бэкапа');
    }
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
              <input type="text" name="site_name" className="sakh-input" defaultValue={settings.site_name || 'Сахалинский портал'} />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Логотип (URL)</label>
              <div className="flex gap-2">
                <input type="text" name="logo_url" className="sakh-input" defaultValue={settings.logo_url || '/logo.svg'} />
                <button className="sakh-btn sakh-btn--secondary sakh-btn--sm" onClick={handleUpload}><Upload size={14} /> Загрузить</button>
              </div>
            </div>
            <div>
              <label className="sakh-caption block mb-1">Favicon (URL)</label>
              <div className="flex gap-2">
                <input type="text" name="favicon_url" className="sakh-input" defaultValue={settings.favicon_url || '/favicon.ico'} />
                <button className="sakh-btn sakh-btn--secondary sakh-btn--sm" onClick={handleUpload}><Upload size={14} /> Загрузить</button>
              </div>
            </div>
            <div>
              <label className="sakh-caption block mb-1">Тема оформления</label>
              <select name="theme" className="sakh-select" defaultValue={settings.theme || 'default'}>
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
              <textarea name="meta_description" className="sakh-textarea" defaultValue={settings.meta_description || 'Новости Сахалина, объявления, погода, карты. Актуальная информация о жизни на острове.'} rows={3} />
            </div>
            <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={e => handleSave(e.currentTarget.parentElement!)}><Save size={14} /> Сохранить</button>
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
              <input type="text" name="seo_title" className="sakh-input" defaultValue={settings.seo_title || 'Сахалинский портал — новости, объявления, погода'} />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Meta Description</label>
              <textarea name="seo_description" className="sakh-textarea" defaultValue={settings.seo_description || 'Новости Сахалина, объявления, погода, карты. Актуальная информация о жизни на острове.'} rows={3} />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Robots.txt</label>
              <textarea name="robots_txt" className="sakh-textarea font-mono text-xs" defaultValue={settings.robots_txt || 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/'} rows={5} />
            </div>
            <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={e => handleSave(e.currentTarget.parentElement!)}><Save size={14} /> Сохранить</button>
          </motion.div>
        )}

        {activeTab === 'social' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
            <div>
              <label className="sakh-caption block mb-1">Telegram (URL)</label>
              <input type="url" name="telegram_url" className="sakh-input" defaultValue={settings.telegram_url || 'https://t.me/recsakh'} placeholder="https://t.me/..." />
            </div>
            <div>
              <label className="sakh-caption block mb-1">ВКонтакте (URL)</label>
              <input type="url" name="vk_url" className="sakh-input" defaultValue={settings.vk_url || 'https://vk.com/recsakh'} placeholder="https://vk.com/..." />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Яндекс.Дзен (URL)</label>
              <input type="url" name="dzen_url" className="sakh-input" defaultValue={settings.dzen_url || 'https://dzen.ru/recsakh'} placeholder="https://dzen.ru/..." />
            </div>
            <div>
              <label className="sakh-caption block mb-1">Одноклассники (URL)</label>
              <input type="url" name="ok_url" className="sakh-input" defaultValue={settings.ok_url || 'https://ok.ru/recsakh'} placeholder="https://ok.ru/..." />
            </div>
            <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={e => handleSave(e.currentTarget.parentElement!)}><Save size={14} /> Сохранить</button>
          </motion.div>
        )}

        {activeTab === 'api' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-2xl">
            {[
              { label: 'Погода (OpenWeatherMap)', key: 'weather', value: '••••••••••••••••' },
              { label: 'Валюты (ExchangeRate)', key: 'currency', value: '••••••••••••••••' },
              { label: 'Карты (Yandex Maps)', key: 'maps', value: '••••••••••••••••' },
            ].map(field => (
              <div key={field.key}>
                <label className="sakh-caption block mb-1">{field.label}</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApi[field.key] ? 'text' : 'password'}
                      name={`api_key_${field.key}`}
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
            <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={e => handleSave(e.currentTarget.parentElement!)}><Save size={14} /> Сохранить</button>
          </motion.div>
        )}

        {activeTab === 'backup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-5">
            <div className="sakh-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Последний бэкап</span>
                <span className="font-mono text-sm text-[var(--text-secondary)]">{settings.last_backup || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="sakh-caption">Статус</span>
                <span className="sakh-tag sakh-tag--accent">Успешно</span>
              </div>
              <hr className="border-[var(--border-color)]" />
              <button className="sakh-btn sakh-btn--primary sakh-btn--md" onClick={handleBackup}><Shield size={14} /> Создать бэкап</button>
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
                  {logEntries.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-8"><p className="sakh-meta">Нет записей</p></td>
                    </tr>
                  )}
                  {logEntries.map((log, i) => (
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
