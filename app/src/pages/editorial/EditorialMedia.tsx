import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Image, Video, FolderOpen, Download, Trash2,
  Upload, CheckSquare, Square,
} from 'lucide-react';

type Tab = 'photos' | 'videos' | 'albums';

const tabs: { value: Tab; label: string }[] = [
  { value: 'photos', label: 'Фото' },
  { value: 'videos', label: 'Видео' },
  { value: 'albums', label: 'Альбомы' },
];

const mockPhotos = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i + 1}`,
  url: `/images/gallery-${(i % 4) + 1}.jpg`,
  name: `photo-${i + 1}.jpg`,
  size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
}));

export default function EditorialMedia() {
  const [activeTab, setActiveTab] = useState<Tab>('photos');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === mockPhotos.length) setSelected(new Set());
    else setSelected(new Set(mockPhotos.map((p) => p.id)));
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) { clearInterval(interval); setIsUploading(false); return 100; }
        return p + 10;
      });
    }, 300);
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
              <button className="sakh-btn sakh-btn--secondary sakh-btn--sm">
                <Download size={14} /> Скачать ({selected.size})
              </button>
              <button className="sakh-btn sakh-btn--danger sakh-btn--sm">
                <Trash2 size={14} /> Удалить
              </button>
            </>
          )}
          <label className="sakh-btn sakh-btn--primary sakh-btn--sm cursor-pointer">
            <Upload size={14} />
            Загрузить
            <input type="file" multiple accept="image/*" className="hidden" />
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

      {isUploading && (
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
        onDrop={(e) => { e.preventDefault(); setDragOver(false); simulateUpload(); }}
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
              {selected.size === mockPhotos.length ? <CheckSquare size={14} /> : <Square size={14} />}
              Выбрать всё
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {mockPhotos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`sakh-card cursor-pointer group ${selected.has(photo.id) ? 'border-[var(--accent-ocean)]' : ''}`}
                onClick={() => toggleSelect(photo.id)}
              >
                <div className="aspect-square bg-[var(--bg-surface)] flex items-center justify-center relative">
                  <Image size={32} className="text-[var(--text-muted)]" />
                  <div className={`absolute top-2 left-2 ${selected.has(photo.id) ? 'text-[var(--accent-ocean)]' : 'text-[var(--text-muted)] opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    {selected.has(photo.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                </div>
                <div className="p-2">
                  <p className="sakh-caption truncate text-[10px]">{photo.name}</p>
                  <p className="sakh-meta text-[10px]">{photo.size}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
