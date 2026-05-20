import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Trash2, Image, FileText, Copy, Download,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '@/services';
import type { MediaFile } from '@/services/admin.service';

export default function AdminMedia() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadFiles = () => {
    setLoading(true);
    adminService.getMediaList()
      .then(setFiles)
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await adminService.uploadFile(file);
      toast.success('Файл загружен');
      loadFiles();
    } catch {
      toast.error('Ошибка при загрузке');
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Удалить файл "${file.filename}"?`)) return;
    try {
      await adminService.deleteMedia(file.filename);
      setFiles(prev => prev.filter(f => f.filename !== file.filename));
      toast.success('Файл удалён');
    } catch {
      toast.error('Ошибка при удалении');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    toast.success('URL скопирован');
  };

  const filtered = files.filter(f =>
    !search || f.filename.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="sakh-heading">Медиатека</h1>
        <label className="sakh-btn sakh-btn--primary sakh-btn--sm cursor-pointer">
          <Upload size={14} />
          {uploading ? 'Загрузка...' : 'Загрузить'}
          <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="sakh-search max-w-sm">
        <Search className="sakh-search__icon" size={14} />
        <input
          type="text"
          placeholder="Поиск файлов..."
          className="sakh-search__input !h-9 !text-xs !pl-8"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="sakh-meta text-center py-8">Загрузка...</p>
      ) : filtered.length === 0 ? (
        <div className="sakh-card p-8 text-center">
          <Image size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="sakh-meta">Файлы не найдены. Загрузите первый файл.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((file, i) => (
            <motion.div
              key={file.filename}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="sakh-card overflow-hidden group"
            >
              <div className="aspect-square bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden relative">
                {file.isImage ? (
                  <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
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
                  <button className="sakh-btn sakh-btn--ghost sakh-btn--sm !text-[var(--accent-sunset)]" title="Удалить" onClick={() => handleDelete(file)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-mono text-[var(--text-primary)] truncate">{file.filename}</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)]">{formatSize(file.size)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
