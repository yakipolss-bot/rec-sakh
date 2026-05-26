import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid3X3 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

export default function CrosswordsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Кроссворды | Сахалин" noIndex />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Кроссворды</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Grid3X3 size={24} className="text-[var(--accent-ocean)]" />
            <h1 className="sakh-heading">Кроссворды</h1>
          </div>
          <p className="sakh-body">Архив кроссвордов</p>
        </motion.div>

        <div className="sakh-card p-6">
          <div className="sakh-empty">
            <Grid3X3 size={48} className="sakh-empty__icon" />
            <h3 className="sakh-empty__title">Кроссвордов пока нет</h3>
            <p className="sakh-empty__description">Кроссворды появятся в этом разделе после публикации.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
