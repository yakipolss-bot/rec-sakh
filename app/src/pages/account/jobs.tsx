import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Plus, Building2, MapPin, Wallet } from 'lucide-react';
import jobsService from '@/services/jobs.service';
import EmptyState from '@/components/EmptyState';
import type { Job } from '@/models/jobs/Job';
import { toast } from 'sonner';

type TabId = 'list' | 'create';

export default function AccountJobs() {
  const [activeTab, setActiveTab] = useState<TabId>('list');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await jobsService.getAll({ perPage: 20, sort: 'createdAt' });
        if (!cancelled) {
          setJobs(res.data || []);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sakh-tabs mb-4">
        <button
          onClick={() => setActiveTab('list')}
          className={`sakh-tabs__item flex items-center gap-2 ${activeTab === 'list' ? 'sakh-tabs__item--active' : ''}`}
        >
          <Briefcase size={14} />
          Все вакансии
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`sakh-tabs__item flex items-center gap-2 ${activeTab === 'create' ? 'sakh-tabs__item--active' : ''}`}
        >
          <Plus size={14} />
          Добавить вакансию
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'list' && (
            loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState title="Нет вакансий" description="Вакансии появятся здесь после добавления" icon={<Briefcase size={48} />} />
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="sakh-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[var(--text-primary)]">{job.title}</h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {job.companyName && (
                            <span className="sakh-meta text-xs flex items-center gap-1">
                              <Building2 size={10} />
                              {job.companyName}
                            </span>
                          )}
                          {job.city && (
                            <span className="sakh-meta text-xs flex items-center gap-1">
                              <MapPin size={10} />
                              {job.city}
                            </span>
                          )}
                          {(job.salaryMin != null || job.salaryMax != null) && (
                            <span className="sakh-tag sakh-tag--accent text-xs flex items-center gap-1">
                              <Wallet size={10} />
                              {job.salaryMin != null ? job.salaryMin : 'до'} – {job.salaryMax != null ? `${job.salaryMax} ${job.currency}` : `${job.currency}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'create' && (
            <div className="sakh-card p-4 sm:p-5">
              <p className="sakh-meta text-sm">Форма добавления вакансии будет доступна после доработки модуля.</p>
              <p className="sakh-meta text-xs mt-2">Пока вы можете просматривать и откликаться на вакансии на основной странице каталога.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
