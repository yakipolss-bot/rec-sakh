import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Briefcase, Clock } from 'lucide-react';
import FilterBar from '@/components/FilterBar';

const JOB_CATEGORIES = [
  { value: 'it', label: 'IT' },
  { value: 'construction', label: 'Строительство' },
  { value: 'transport', label: 'Транспорт' },
  { value: 'trade', label: 'Торговля' },
  { value: 'medicine', label: 'Медицина' },
  { value: 'education', label: 'Образование' },
];

const CITIES = [
  { value: 'yuzhno', label: 'Южно-Сахалинск' },
  { value: 'korsakov', label: 'Корсаков' },
  { value: 'kholmsk', label: 'Холмск' },
  { value: 'okha', label: 'Оха' },
  { value: 'nevelsk', label: 'Невельск' },
];

const SCHEDULES = [
  { value: 'full', label: 'Полный день' },
  { value: 'part', label: 'Частичная' },
  { value: 'remote', label: 'Удалённо' },
  { value: 'shift', label: 'Вахта' },
];

interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  city: string;
  schedule: string;
  category: string;
  type: string;
}

const mockJobs: Job[] = [
  { id: 'j1', title: 'React-разработчик', company: 'Сахком', salary: '150 000 – 200 000 ₽', city: 'Южно-Сахалинск', schedule: 'full', category: 'it', type: 'vacancy' },
  { id: 'j2', title: 'Водитель категории C', company: 'Автопарк №1', salary: '80 000 – 100 000 ₽', city: 'Корсаков', schedule: 'full', category: 'transport', type: 'vacancy' },
  { id: 'j3', title: 'Инженер-строитель', company: 'Сахалинстрой', salary: '120 000 – 150 000 ₽', city: 'Южно-Сахалинск', schedule: 'full', category: 'construction', type: 'vacancy' },
  { id: 'j4', title: 'Продавец-консультант', company: 'Эльдорадо', salary: '45 000 – 60 000 ₽', city: 'Холмск', schedule: 'part', category: 'trade', type: 'vacancy' },
  { id: 'j5', title: 'Врач-терапевт', company: 'Городская больница', salary: '100 000 – 130 000 ₽', city: 'Южно-Сахалинск', schedule: 'full', category: 'medicine', type: 'vacancy' },
  { id: 'j6', title: 'Учитель математики', company: 'Школа №3', salary: '55 000 – 70 000 ₽', city: 'Оха', schedule: 'full', category: 'education', type: 'vacancy' },
  { id: 'j7', title: 'Python-разработчик', company: 'Digital Sakhalin', salary: '180 000 – 250 000 ₽', city: 'Южно-Сахалинск', schedule: 'remote', category: 'it', type: 'vacancy' },
  { id: 'j8', title: 'Вахтовый рабочий', company: 'Нефтегазстрой', salary: '150 000 ₽', city: 'Оха', schedule: 'shift', category: 'construction', type: 'vacancy' },
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
  const [mode, setMode] = useState<'vacancy' | 'resume'>('vacancy');
  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<string | null>(null);

  let filtered = mockJobs.filter(j => j.type === mode);
  if (category) filtered = filtered.filter(j => j.category === category);
  if (city) filtered = filtered.filter(j => j.city === CITIES.find(c => c.value === city)?.label || '');
  if (schedule) filtered = filtered.filter(j => j.schedule === schedule);

  return (
    <div className="pt-20 pb-8">
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
          <FilterBar options={JOB_CATEGORIES} selected={category} onChange={setCategory} allLabel="Все категории" />
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

        <motion.div
          key={`${mode}-${category}-${city}-${schedule}`}
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
                      <span className="sakh-meta sakh-meta--with-icon">
                        <Briefcase size={12} />
                        {job.company}
                      </span>
                      <span className="sakh-meta sakh-meta--with-icon">
                        <MapPin size={12} />
                        {job.city}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-mono font-bold text-[var(--accent-ocean)]">{job.salary}</div>
                    <span className="sakh-tag sakh-tag--muted mt-1">
                      {SCHEDULES.find(s => s.value === job.schedule)?.label}
                    </span>
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
      </div>
    </div>
  );
}
