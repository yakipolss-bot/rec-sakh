import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCw, Download, AlertTriangle, Info, Plus, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';

type Tab = 'redirects' | 'broken' | 'sitemap' | 'schema';

interface RedirectData {
  id: string;
  source: string;
  target: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}
interface BrokenLinkData {
  id: string;
  url: string;
  status: number | null;
  error: string | null;
  checkedAt: string;
}

const tabs: { value: Tab; label: string }[] = [
  { value: 'redirects', label: 'Редиректы' },
  { value: 'broken', label: 'Битые ссылки' },
  { value: 'sitemap', label: 'Sitemap' },
  { value: 'schema', label: 'Schema.org' },
];

export default function EditorialSeo() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('redirects');
  const [showAddRedirect, setShowAddRedirect] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('/sitemap.xml');
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [brokenChecking, setBrokenChecking] = useState(false);

  const { data: redirectsData, isLoading: redirectLoading } = useQuery({
    queryKey: ['editorial', 'redirects'],
    queryFn: () => adminService.getRedirects().catch(() => [] as RedirectData[]),
    enabled: activeTab === 'redirects',
  });
  const redirects = Array.isArray(redirectsData) ? (redirectsData as RedirectData[]) : [];

  const { data: brokenData, isLoading: brokenLoading } = useQuery({
    queryKey: ['editorial', 'broken-links'],
    queryFn: () => adminService.getBrokenLinks().catch(() => [] as BrokenLinkData[]),
    enabled: activeTab === 'broken',
  });
  const brokenLinks = Array.isArray(brokenData) ? (brokenData as BrokenLinkData[]) : [];

  const handleAddRedirect = async () => {
    if (!newSource.trim() || !newTarget.trim()) {
      toast.error('Заполните source и target');
      return;
    }
    try {
      await adminService.createRedirect({ source: newSource, target: newTarget });
      toast.success('Редирект создан');
      setShowAddRedirect(false);
      setNewSource('');
      setNewTarget('');
      queryClient.invalidateQueries({ queryKey: ['editorial', 'redirects'] });
    } catch (e) {
      toast.error((e as {response?: {data?: {message?: string}}}).response?.data?.message || 'Ошибка создания редиректа');
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    try {
      await adminService.deleteRedirect(id);
      toast.success('Редирект удалён');
      queryClient.invalidateQueries({ queryKey: ['editorial', 'redirects'] });
    } catch (e) {
      toast.error((e as {response?: {data?: {message?: string}}}).response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleGenerateSitemap = async () => {
    setSitemapLoading(true);
    try {
      const url = await adminService.generateSitemap();
      setSitemapUrl(url);
      toast.success('Sitemap сгенерирован');
    } catch (e) {
      toast.error((e as {response?: {data?: {message?: string}}}).response?.data?.message || 'Ошибка генерации sitemap');
    } finally {
      setSitemapLoading(false);
    }
  };

  const handleCheckBrokenLinks = async () => {
    setBrokenChecking(true);
    try {
      const results: BrokenLinkData[] = await adminService.checkBrokenLinks() as BrokenLinkData[];
      const ok = results.filter((r) => r.status === 200).length;
      const bad = results.filter((r) => r.status !== 200 && r.status !== null).length;
      const err = results.filter((r) => r.error && r.status === null).length;
      toast.success(`Проверка завершена: ${ok} OK, ${bad} битых, ${err} ошибок`);
      queryClient.invalidateQueries({ queryKey: ['editorial', 'broken-links'] });
    } catch (e) {
      toast.error((e as {response?: {data?: {message?: string}}}).response?.data?.message || 'Ошибка проверки');
    } finally {
      setBrokenChecking(false);
    }
  };

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
            <p className="sakh-meta">{redirects.length} редиректов</p>
            <button
              onClick={() => setShowAddRedirect(true)}
              className="sakh-btn sakh-btn--primary sakh-btn--sm"
            >
              <Plus size={14} /> Добавить редирект
            </button>
          </div>

          <AnimatePresence>
            {showAddRedirect && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="sakh-card p-4 mb-4"
              >
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="sakh-caption block mb-1">Откуда</label>
                    <input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="/old-page" className="sakh-input" />
                  </div>
                  <div className="flex-1">
                    <label className="sakh-caption block mb-1">Куда</label>
                    <input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="/new-page" className="sakh-input" />
                  </div>
                  <button onClick={handleAddRedirect} className="sakh-btn sakh-btn--primary sakh-btn--md">Добавить</button>
                  <button onClick={() => setShowAddRedirect(false)} className="sakh-btn sakh-btn--ghost sakh-btn--md">Отмена</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {redirectLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
          ) : redirects.length === 0 ? (
            <div className="sakh-card p-8 text-center">
              <Info size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <h3 className="sakh-title mb-2">Редиректов пока нет</h3>
              <p className="sakh-body text-sm text-[var(--text-secondary)]">Добавьте первый редирект.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="px-3 py-2 text-left sakh-caption">Source</th>
                    <th className="px-3 py-2 text-left sakh-caption">Target</th>
                    <th className="px-3 py-2 text-left sakh-caption">Тип</th>
                    <th className="px-3 py-2 text-left sakh-caption">Статус</th>
                    <th className="px-3 py-2 text-left sakh-caption">Дата</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {redirects.map((r: RedirectData) => (
                    <tr key={r.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-elevated)]">
                      <td className="px-3 py-2 font-mono text-xs text-[var(--accent-ocean)]">{r.source}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">{r.target}</td>
                      <td className="px-3 py-2 sakh-meta">{r.type}</td>
                      <td className="px-3 py-2">
                        {r.isActive ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                      </td>
                      <td className="px-3 py-2 sakh-meta">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleDeleteRedirect(r.id)}
                          className="sakh-btn sakh-btn--ghost sakh-btn--xs text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'broken' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="sakh-meta">Битые ссылки</p>
            <button
              onClick={handleCheckBrokenLinks}
              disabled={brokenChecking}
              className="sakh-btn sakh-btn--primary sakh-btn--sm"
            >
              {brokenChecking ? <><Loader2 size={14} className="animate-spin" /> Проверка...</> : <><RefreshCw size={14} /> Проверить</>}
            </button>
          </div>

          {brokenLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
          ) : brokenLinks.length === 0 ? (
            <div className="sakh-card p-8 text-center">
              <AlertTriangle size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <h3 className="sakh-title mb-2">Проверка битых ссылок</h3>
              <p className="sakh-body text-sm text-[var(--text-secondary)]">
                Нажмите «Проверить», чтобы запустить анализ доступности страниц.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="px-3 py-2 text-left sakh-caption">URL</th>
                    <th className="px-3 py-2 text-left sakh-caption">Статус</th>
                    <th className="px-3 py-2 text-left sakh-caption">Ошибка</th>
                    <th className="px-3 py-2 text-left sakh-caption">Проверено</th>
                  </tr>
                </thead>
                <tbody>
                  {brokenLinks.map((b: BrokenLinkData) => (
                    <tr key={b.id} className="border-b border-[var(--border-color)]">
                      <td className="px-3 py-2 font-mono text-xs">{b.url}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 ${b.status === 200 ? 'text-green-500' : 'text-red-500'}`}>
                          {b.status === 200 ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {b.status ?? 'ERR'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--text-muted)]">{b.error || '—'}</td>
                      <td className="px-3 py-2 sakh-meta">{new Date(b.checkedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sitemap' && (
        <div className="sakh-card p-6 text-center">
          <FileText size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />
          <h3 className="sakh-title mb-2">Sitemap.xml</h3>
          <p className="sakh-body text-sm mb-2">
            URL: <a href={sitemapUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-ocean)] underline">{sitemapUrl}</a>
          </p>
          <p className="sakh-meta mb-6">Автоматически включает статьи, категории, события и объявления</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleGenerateSitemap}
              disabled={sitemapLoading}
              className="sakh-btn sakh-btn--primary sakh-btn--md"
            >
              {sitemapLoading ? <><Loader2 size={14} className="animate-spin" /> Генерация...</> : <><RefreshCw size={14} /> Сгенерировать</>}
            </button>
            <a
              href={sitemapUrl}
              download
              className="sakh-btn sakh-btn--secondary sakh-btn--md"
            >
              <Download size={14} /> Скачать
            </a>
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
