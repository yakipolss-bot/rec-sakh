import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, FileText, Search, RefreshCw, Download, AlertTriangle } from 'lucide-react';
import { editorialRedirects, editorialBrokenLinks } from '@/data/editorialMock';

type Tab = 'redirects' | 'broken' | 'sitemap' | 'schema';

const tabs: { value: Tab; label: string }[] = [
  { value: 'redirects', label: 'Редиректы' },
  { value: 'broken', label: 'Битые ссылки' },
  { value: 'sitemap', label: 'Sitemap' },
  { value: 'schema', label: 'Schema.org' },
];

export default function EditorialSeo() {
  const [activeTab, setActiveTab] = useState<Tab>('redirects');

  return (
    <div>
      <h1 className="sakh-heading mb-2">SEO-инструменты</h1>
      <p className="sakh-meta mb-6">Управление поисковой оптимизацией портала</p>

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

      {activeTab === 'redirects' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="sakh-meta">Управление редиректами</p>
            <button className="sakh-btn sakh-btn--primary sakh-btn--sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Добавить редирект
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-3 py-2 text-left sakh-caption">From</th>
                  <th className="px-3 py-2 text-left sakh-caption">To</th>
                  <th className="px-3 py-2 text-left sakh-caption">Создан</th>
                </tr>
              </thead>
              <tbody>
                {editorialRedirects.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border-color)]">
                    <td className="px-3 py-2 font-mono text-xs text-[var(--accent-ocean)]">{r.from}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{r.to}</td>
                    <td className="px-3 py-2 sakh-meta">{r.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'broken' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="sakh-meta">Битые ссылки</p>
            <button className="sakh-btn sakh-btn--secondary sakh-btn--sm">
              <RefreshCw size={14} /> Проверить
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-3 py-2 text-left sakh-caption">URL</th>
                  <th className="px-3 py-2 text-left sakh-caption">Код ответа</th>
                  <th className="px-3 py-2 text-left sakh-caption">Обнаружена</th>
                </tr>
              </thead>
              <tbody>
                {editorialBrokenLinks.map((link) => (
                  <tr key={link.id} className="border-b border-[var(--border-color)]">
                    <td className="px-3 py-2 font-mono text-xs text-[var(--accent-sunset)] line-through">{link.url}</td>
                    <td className="px-3 py-2">
                      <span className={`sakh-tag ${link.statusCode >= 500 ? 'sakh-tag--sunset' : 'sakh-tag--sunset'}`}>
                        {link.statusCode}
                      </span>
                    </td>
                    <td className="px-3 py-2 sakh-meta">{link.foundAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'sitemap' && (
        <div className="sakh-card p-6 text-center">
          <FileText size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h3 className="sakh-title mb-2">Sitemap.xml</h3>
          <p className="sakh-body text-sm mb-6">
            Последняя генерация: 15.05.2026. URL: https://rec-sakh.ru/sitemap.xml
          </p>
          <div className="flex items-center justify-center gap-3">
            <button className="sakh-btn sakh-btn--primary sakh-btn--md">
              <RefreshCw size={14} /> Сгенерировать
            </button>
            <button className="sakh-btn sakh-btn--secondary sakh-btn--md">
              <Download size={14} /> Скачать
            </button>
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="sakh-card p-6">
          <h3 className="sakh-caption text-[var(--text-secondary)] mb-4">Проверка Schema.org разметки</h3>
          <div className="space-y-3">
            {['Article', 'NewsArticle', 'BreadcrumbList', 'WebSite', 'Organization'].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 bg-[var(--bg-surface)]">
                <span className="text-sm text-[var(--text-primary)]">{item}</span>
                <span className="sakh-tag sakh-tag--accent">OK</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
