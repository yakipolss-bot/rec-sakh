import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image, Video, Radio, Loader2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import adminService from '@/services/admin.service';
import type { MediaFile } from '@/models/admin/MediaFile';

type MediaTab = 'photos' | 'videos' | 'live';

const TABS: { value: MediaTab; label: string; icon: React.ReactNode }[] = [
  { value: 'photos', label: 'Фото', icon: <Image size={14} /> },
  { value: 'videos', label: 'Видео', icon: <Video size={14} /> },
  { value: 'live', label: 'Прямые эфиры', icon: <Radio size={14} /> },
];

export default function MediaPage() {
  const [tab, setTab] = useState<MediaTab>('photos');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const files = await adminService.getMediaList();
        if (!cancelled) setMediaFiles(files);
      } catch {
        if (!cancelled) setMediaFiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  const photos = mediaFiles.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.filename));
  const videos = mediaFiles.filter(f => /\.(mp4|webm|mov|avi|mkv)$/i.test(f.filename));

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Медиа | Сахалин" noIndex />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Медиа</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Медиа</h1>
          <p className="sakh-body">Фото, видео и прямые эфиры</p>
        </motion.div>

        <div className="sakh-tabs mb-6">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`sakh-tabs__item ${tab === t.value ? 'sakh-tabs__item--active' : ''}`}
            >
              <span className="inline-flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[var(--accent-ocean)]" />
                </div>
              ) : photos.length === 0 ? (
                <div className="sakh-card p-6">
                  <div className="sakh-empty">
                    <Image size={48} className="sakh-empty__icon" />
                    <h3 className="sakh-empty__title">Фотографии пока не добавлены</h3>
                    <p className="sakh-empty__description">Фотогалерея пополняется материалами наших корреспондентов.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {photos.map((photo, i) => (
                    <a
                      key={photo.filename}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sakh-card group overflow-hidden aspect-square"
                    >
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Image size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[var(--accent-ocean)]" />
                </div>
              ) : videos.length === 0 ? (
                <div className="sakh-card p-6">
                  <div className="sakh-empty">
                    <Video size={48} className="sakh-empty__icon" />
                    <h3 className="sakh-empty__title">Видео пока не добавлены</h3>
                    <p className="sakh-empty__description">Видеоматериалы появятся после публикации.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map(video => (
                    <a
                      key={video.filename}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sakh-card group overflow-hidden"
                    >
                      <div className="relative aspect-video bg-[var(--bg-primary)] flex items-center justify-center">
                        <Video size={32} className="text-[var(--accent-ocean)] opacity-40 group-hover:opacity-80 transition-opacity" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{video.filename}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="sakh-card p-6">
                <div className="sakh-empty">
                  <Radio size={48} className="sakh-empty__icon" />
                  <h3 className="sakh-empty__title">Прямых эфиров сейчас нет</h3>
                  <p className="sakh-empty__description">Когда начнётся трансляция, она появится здесь.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
