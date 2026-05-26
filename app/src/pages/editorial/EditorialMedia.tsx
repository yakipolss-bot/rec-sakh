import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Image, Video, FolderOpen, Trash2,
  Upload, CheckSquare, Square, Loader2,
} from 'lucide-react';
import { adminService } from '@/services';
import type { MediaFile } from '@/models/admin/MediaFile';
import { toast } from 'sonner';

type Tab = 'photos' | 'videos' | 'albums';

const tabs: { value: Tab; label: string }[] = [
  { value: 'photos', label: 'Фото' },
  { value: 'videos', label: 'Видео' },
  { value: 'albums', label: 'Альбомы' },
];

export default function EditorialMedia() {
  const queryClient = useQueryClient();
  const { section } = useParams();
  const sectionToTab: Record<string, Tab> = { photos: 'photos', videos: 'videos', albums: 'albums' };
  const [activeTab, setActiveTab] = useState<Tab>((section && sectionToTab[section]) || 'photos');

  useEffect(() => {
    if (section && sectionToTab[section]) setActiveTab(sectionToTab[section]);
  }, [section]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: filesData, isLoading } = useQuery({
    queryKey: ['editorial', 'media'],
    queryFn: () => adminService.getMediaList().catch(() => [] as MediaFile[]),
    refetchInterval: 60000,
  });
  const files = Array.isArray(filesData) ? (filesData as MediaFile[]) : [];

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === files.length) setSelected(new Set());
    else setSelected(new Set(files.map((f) => f.filename)));
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setIsUploading(true);
    setUploadProgress(0);
    const total = fileList.length;
    let done = 0;
    for (const file of fileList) {
      try {
        const result = await adminService.uploadFile(file);
        if (result?.url) toast.success(`Загружен: ${file.name}`);
      } catch {
        toast.error(`Ошибка загрузки: ${file.name}`);
      }
      done++;
      setUploadProgress(Math.round((done / total) * 100));
    }
    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: ['editorial', 'media'] });
  };

  const handleDelete = async () => {
    for (const filename of selected) {
      try {
        await adminService.deleteMedia(filename);
      } catch {
        toast.error(`Ошибка удаления: ${filename}`);
      }
    }
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ['editorial', 'media'] });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="sakh-heading">Медиабиблиотека</h1>
          <p className="sakh-meta mt-1">Управление фото и видео материалами</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <button className="sakh-btn sakh-btn--danger sakh-btn--sm" onClick={handleDelete}>
                <Trash2 size={14} /> Удалить ({selected.size})
              </button>
            </>
          )}
          <label className="sakh-btn sakh-btn--primary sakh-btn--sm cursor-pointer">
            <Upload size={14} />
            Загрузить
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      <div className="sakh-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`sakh-tabs__item ${activeTab === tab.value ? 'sakh-tabs__item--active' : ''}`}
          >
            {tab.value === 'photos' && <Image size={14} className="inline mr-1.5" />}
            {tab.value === 'videos' && <Video size={14} className="inline mr-1.5" />}
            {tab.value === 'albums' && <FolderOpen size={14} className="inline mr-1.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {(isUploading || uploadProgress > 0) && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--text-secondary)]">Загрузка...</span>
            <span className="font-mono text-[var(--text-primary)]">{uploadProgress}%</span>
          </div>
          <div className="sakh-progress">
            <div className="sakh-progress__bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        className={`border-2 border-dashed p-6 text-center mb-6 transition-colors ${
          dragOver ? 'border-[var(--accent-ocean)] bg-[var(--ocean-alpha-10)]' : 'border-[var(--border-color)]'
        }`}
      >
        <Upload size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
        <p className="sakh-body text-sm">Перетащите файлы сюда для загрузки</p>
      </div>

      {activeTab === 'photos' && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={selectAll} className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-ocean)] transition-colors">
              {selected.size === files.length ? <CheckSquare size={14} /> : <Square size={14} />}
              Выбрать всё
            </button>
            {files.length > 0 && (
              <span className="text-xs text-[var(--text-muted)]">{files.length} файлов</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--accent-ocean)]" />
            </div>
          ) : files.length === 0 ? (
            <div className="sakh-card p-8 text-center">
              <Image size={40} className="mx-auto mb-4 text-[var(--text-muted)]" />
              <h3 className="sakh-title mb-2">Файлы не загружены</h3>
              <p className="sakh-body text-sm text-[var(--text-secondary)]">
                Перетащите файлы или нажмите «Загрузить»
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {files.map((file) => (
                <motion.div
                  key={file.filename}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`sakh-card cursor-pointer group ${selected.has(file.filename) ? 'border-[var(--accent-ocean)]' : ''}`}
                  onClick={() => toggleSelect(file.filename)}
                >
                  <div className="aspect-square bg-[var(--bg-surface)] flex items-center justify-center relative overflow-hidden">
                    {file.isImage ? (
                      <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                    ) : (
                      <Image size={32} className="text-[var(--text-muted)]" />
                    )}
                    <div className={`absolute top-2 left-2 ${selected.has(file.filename) ? 'text-[var(--accent-ocean)]' : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      {selected.has(file.filename) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="sakh-caption truncate text-[10px]">{file.filename}</p>
                    <p className="sakh-meta text-[10px]">{formatSize(file.size)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'videos' && (
        <div className="sakh-empty">
          <Video size={48} className="sakh-empty__icon" />
          <h3 className="sakh-empty__title">Видео не загружены</h3>
          <p className="sakh-empty__description">Загрузите видео для отображения в библиотеке</p>
        </div>
      )}

      {activeTab === 'albums' && (
        <div className="sakh-empty">
          <FolderOpen size={48} className="sakh-empty__icon" />
          <h3 className="sakh-empty__title">Нет альбомов</h3>
          <p className="sakh-empty__description">Создайте альбом для организации медиафайлов</p>
          <button className="sakh-btn sakh-btn--primary sakh-btn--md">
            <FolderOpen size={14} /> Создать альбом
          </button>
        </div>
      )}
    </div>
  );
}
