import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image, Video, Radio, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

type MediaTab = 'photos' | 'videos' | 'live';

const TABS: { value: MediaTab; label: string; icon: React.ReactNode }[] = [
  { value: 'photos', label: 'Фото', icon: <Image size={14} /> },
  { value: 'videos', label: 'Видео', icon: <Video size={14} /> },
  { value: 'live', label: 'Прямые эфиры', icon: <Radio size={14} /> },
];

const mockPhotos = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i + 1}`,
  src: '/images/news-city.jpg',
  title: `Фото ${i + 1}: Городские зарисовки`,
}));

const mockVideos = Array.from({ length: 6 }, (_, i) => ({
  id: `v${i + 1}`,
  title: `Видео ${i + 1}: Репортаж с места событий`,
  duration: `${Math.floor(Math.random() * 10) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
}));

export default function MediaPage() {
  const [tab, setTab] = useState<MediaTab>('photos');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

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
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            >
              {mockPhotos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => openLightbox(i)}
                  className="sakh-card group overflow-hidden aspect-square cursor-pointer"
                >
                  <img
                    src={photo.src}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Image size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {tab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {mockVideos.map((video) => (
                <div key={video.id} className="sakh-card group cursor-pointer">
                  <div className="relative aspect-video bg-[var(--bg-primary)] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-ocean)]/20 flex items-center justify-center group-hover:bg-[var(--accent-ocean)]/40 transition-colors">
                      <Play size={24} className="text-[var(--accent-ocean)] ml-1" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-mono px-1.5 py-0.5">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">{video.title}</h3>
                  </div>
                </div>
              ))}
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

        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sakh-modal-overlay"
              onClick={() => setLightboxOpen(false)}
            >
              <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute -top-10 right-0 text-white hover:text-[var(--accent-ocean)] transition-colors"
                >
                  <X size={24} />
                </button>
                <div className="relative">
                  <img
                    src={mockPhotos[lightboxIndex]?.src}
                    alt={mockPhotos[lightboxIndex]?.title}
                    className="w-full aspect-video object-cover"
                  />
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex - 1 + mockPhotos.length) % mockPhotos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % mockPhotos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
                <div className="bg-[var(--bg-secondary)] p-3 border-t border-[var(--border-color)]">
                  <p className="sakh-body text-sm">{mockPhotos[lightboxIndex]?.title}</p>
                  <p className="sakh-caption mt-1">{lightboxIndex + 1} / {mockPhotos.length}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
