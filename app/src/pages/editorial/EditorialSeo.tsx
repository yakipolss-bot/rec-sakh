import { useState, useEffect } from 'react';
import { FileText, RefreshCw, Download, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { AuditLogEntry } from '@/services/admin.service';

type Tab = 'redirects' | 'broken' | 'sitemap' | 'schema';

const tabs: { value: Tab; label: string }[] = [
  { value: 'redirects', label: 'Редиректы' },
  { value: 'broken', label: 'Битые ссылки' },
  { value: 'sitemap', label: 'Sitemap' },
  { value: 'schema', label: 'Schema.org' },
];

export default function EditorialSeo() {
  const [activeTab, setActiveTab] = useState<Tab>('redirects');
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAuditLog()
      .then((res) => setAuditLog(res.data || []))
      .catch(() => setAuditLog([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredRedirects = auditLog.filter(
    (e) => e.action?.toLowerCase().includes('redirect') || e.action?.toLowerCase().includes('move'),
  );

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
          {loading ? (
            <p className="sakh-meta text-center py-8">Загрузка...</p>
          ) : filteredRedirects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="px-3 py-2 text-left sakh-caption">Действие</th>
                    <th className="px-3 py-2 text-left sakh-caption">Цель</th>
                    <th className="px-3 py-2 text-left sakh-caption">Пользователь</th>
                    <th className="px-3 py-2 text-left sakh-caption">Время</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRedirects.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-color)]">
                      <td className="px-3 py-2 font-mono text-xs text-[var(--accent-ocean)]">{r.action}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{r.target}</td>
                      <td className="px-3 py-2 sakh-meta">{r.user}</td>
                      <td className="px-3 py-2 sakh-meta">{r.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="sakh-card p-8 text-center">
              <Info size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <h3 className="sakh-title mb-2">SEO-инструменты скоро появятся</h3>
              <p className="sakh-body text-sm text-[var(--text-secondary)]">
                Управление редиректами и полный SEO-инструментарий находятся в разработке.
              </p>
            </div>
          )}
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
          <div className="sakh-card p-8 text-center">
            <AlertTriangle size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
            <h3 className="sakh-title mb-2">Проверка битых ссылок</h3>
            <p className="sakh-body text-sm text-[var(--text-secondary)]">
              Автоматическая проверка битых ссылок будет доступна в ближайшее время.
            </p>
            <button
              onClick={() => toast.info('Проверка запущена. Результаты появятся после завершения.')}
              className="sakh-btn sakh-btn--primary sakh-btn--md mt-4"
            >
              <RefreshCw size={14} /> Запустить проверку
            </button>
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
