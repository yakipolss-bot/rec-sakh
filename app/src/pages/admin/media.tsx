import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Trash2, Image, FileText, Copy, Download, Search, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { MediaFile } from '@/models/admin/MediaFile';

const PER_PAGE = 20;

export default function AdminMedia() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['admin', 'media'],
    queryFn: () => adminService.getMediaList().catch(() => []),
  });

  const filtered = files.filter(f =>
    !search || f.filename.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetPage = () => setPage(1);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      await adminService.uploadFile(file);
      toast.success(`Загружен: ${file.name}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    } catch {
      toast.error(`Ошибка: ${file.name}`);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (fl) Array.from(fl).forEach(upload);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(upload);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Удалить "${name}"?`)) return;
    try {
      await adminService.deleteMedia(name);
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      setSelected(prev => { const next = new Set(prev); next.delete(name); return next; });
      toast.success('Удалён');
    } catch {
      toast.error('Ошибка');
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Удалить ${selected.size} файл(ов)?`)) return;
    for (const name of selected) {
      try { await adminService.deleteMedia(name); } catch { /* skip */ }
    }
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    toast.success(`Удалено ${selected.size} файл(ов)`);
  };

  const toggleSelect = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    toast.success('URL скопирован');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="sakh-heading">Медиатека</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={deleteSelected} className="sakh-btn sakh-btn--destructive sakh-btn--sm">
              <Trash2 size={14} /> {selected.size}
            </button>
          )}
          <label className="sakh-btn sakh-btn--primary sakh-btn--sm cursor-pointer">
            <Upload size={14} />
            {uploading ? 'Загрузка...' : 'Загрузить'}
            <input ref={inputRef} type="file" className="hidden" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.mp4,.webm" onChange={handleChange} disabled={uploading} />
          </label>
        </div>
      </div>

      <div
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative transition-colors ${dragOver ? 'ring-2 ring-[var(--accent-ocean)]' : ''}`}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 bg-[var(--accent-ocean)]/10 flex items-center justify-center border-2 border-dashed border-[var(--accent-ocean)]">
            <p className="text-lg font-bold text-[var(--accent-ocean)]">Отпустите файлы для загрузки</p>
          </div>
        )}

        <div className="sakh-search max-w-sm mb-4">
          <Search className="sakh-search__icon" size={14} />
          <input
            type="text" placeholder="Поиск файлов..." className="sakh-search__input !h-9 !text-xs !pl-8"
            value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}
          />
          {search && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]" onClick={() => { setSearch(''); resetPage(); }}>
              <X size={12} />
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="sakh-meta text-center py-8">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <div className="sakh-card p-8 text-center">
            <Image size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="sakh-meta mb-3">Файлы не найдены.</p>
            <label className="sakh-btn sakh-btn--secondary sakh-btn--sm cursor-pointer">
              <Upload size={14} /> Загрузить первый файл
              <input type="file" className="hidden" multiple accept="image/*" onChange={handleChange} />
            </label>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {paged.map((file, i) => (
                <motion.div
                  key={file.filename}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`sakh-card overflow-hidden group relative ${selected.has(file.filename) ? 'ring-2 ring-[var(--accent-ocean)]' : ''}`}
                >
                  <button
                    onClick={() => toggleSelect(file.filename)}
                    className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 transition-colors ${
                      selected.has(file.filename)
                        ? 'bg-[var(--accent-ocean)] border-[var(--accent-ocean)]'
                        : 'bg-black/40 border-white/60 hover:bg-black/60'
                    }`}
                  >
                    {selected.has(file.filename) && (
                      <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="aspect-square bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden relative">
                    {file.isImage ? (
                      <img src={file.url} alt={file.filename} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <FileText size={32} className="text-[var(--text-muted)]" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !text-white" title="Копировать URL" onClick={() => copyUrl(file.url)}>
                        <Copy size={14} />
                      </button>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !text-white" title="Скачать" onClick={() => window.open(file.url, '_blank')}>
                        <Download size={14} />
                      </button>
                      <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !text-[var(--accent-sunset)]" title="Удалить" onClick={() => handleDelete(file.filename)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] font-mono text-[var(--text-primary)] truncate" title={file.filename}>{file.filename}</p>
                    <p className="text-[10px] font-mono text-[var(--text-muted)]">{formatSize(file.size)}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="sakh-btn sakh-btn--ghost sakh-btn--sm disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-[var(--accent-ocean)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="sakh-btn sakh-btn--ghost sakh-btn--sm disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
