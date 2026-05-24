import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Briefcase, Clock, Search, Building2, CircleDollarSign } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import jobsService from '@/services/jobs.service';
import type { Job } from '@/models/jobs/Job';
import SEOHead from '@/components/SEOHead';

const CITIES = [
  { value: 'Южно-Сахалинск', label: 'Южно-Сахалинск' },
  { value: 'Корсаков', label: 'Корсаков' },
  { value: 'Холмск', label: 'Холмск' },
  { value: 'Оха', label: 'Оха' },
  { value: 'Невельск', label: 'Невельск' },
];

const SCHEDULES = [
  { value: 'полный день', label: 'Полный день' },
  { value: 'сменный', label: 'Сменный' },
  { value: 'удалённо', label: 'Удалённо' },
  { value: 'вахта', label: 'Вахта' },
  { value: 'гибкий', label: 'Гибкий' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'vacancy' | 'resume'>('vacancy');
  const [city, setCity] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await jobsService.getAll({ type: mode, perPage: 50 });
        if (!cancelled) setJobs(res.data || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [mode]);

  let filtered = jobs;
  if (city) filtered = filtered.filter(j => j.city === city);
  if (schedule) filtered = filtered.filter(j => j.schedule === schedule);
  if (search) filtered = filtered.filter(j => j.title.toLowerCase().includes(search.toLowerCase()));

  const formatSalary = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return 'з/п не указана';
    if (job.salaryMin && job.salaryMax) return `${job.salaryMin.toLocaleString('ru-RU')} – ${job.salaryMax.toLocaleString('ru-RU')} ₽`;
    if (job.salaryMin) return `от ${job.salaryMin.toLocaleString('ru-RU')} ₽`;
    return `до ${job.salaryMax!.toLocaleString('ru-RU')} ₽`;
  };

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Работа | Сахалин" description="Вакансии на Сахалине. Свежие предложения работы." />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Работа</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Работа на Сахалине</h1>
          <p className="sakh-body">Вакансии и резюме</p>
        </motion.div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('vacancy')}
            className={mode === 'vacancy' ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
          >
            <Briefcase size={12} className="inline mr-1" />
            Вакансии
          </button>
          <button
            onClick={() => setMode('resume')}
            className={mode === 'resume' ? 'sakh-tag sakh-tag--accent' : 'sakh-tag sakh-tag--outline'}
          >
            Резюме
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6 pb-3 border-b border-[var(--border-color)]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Поиск вакансий..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="sakh-input pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[var(--text-muted)]" />
              <span className="sakh-caption">Город:</span>
              <FilterBar options={CITIES} selected={city} onChange={setCity} allLabel="Все" />
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[var(--text-muted)]" />
              <span className="sakh-caption">График:</span>
              <FilterBar options={SCHEDULES} selected={schedule} onChange={setSchedule} allLabel="Все" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase size={48} className="mx-auto text-[var(--text-muted)] mb-4" />
            <p className="sakh-body text-[var(--text-secondary)]">Вакансий не найдено</p>
          </div>
        ) : (
          <motion.div
            key={`${mode}-${city}-${schedule}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filtered.map((job) => (
              <motion.div key={job.id} variants={cardVariants}>
                <div className="sakh-card p-4 group cursor-pointer">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="sakh-title mb-1 group-hover:text-[var(--accent-ocean)] transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        {job.companyName && (
                          <span className="sakh-meta sakh-meta--with-icon">
                            <Building2 size={12} />
                            {job.companyName}
                          </span>
                        )}
                        <span className="sakh-meta sakh-meta--with-icon">
                          <MapPin size={12} />
                          {job.city}
                        </span>
                        {job.experience && (
                          <span className="sakh-meta sakh-meta--with-icon">
                            <Clock size={12} />
                            {job.experience}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-mono font-bold text-[var(--accent-ocean)] flex items-center gap-1 justify-end">
                        <CircleDollarSign size={14} />
                        {formatSalary(job)}
                      </div>
                      {job.schedule && (
                        <span className="sakh-tag sakh-tag--muted mt-1">
                          {job.schedule}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex justify-end">
                    <button className="sakh-btn sakh-btn--secondary sakh-btn--sm">
                      Откликнуться
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
