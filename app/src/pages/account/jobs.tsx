import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, FileText, Send, MapPin, Calendar, Eye } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

type TabId = 'resumes' | 'vacancies' | 'responses';

const tabs: { id: TabId; label: string }[] = [
  { id: 'resumes', label: 'Резюме' },
  { id: 'vacancies', label: 'Вакансии' },
  { id: 'responses', label: 'Отклики' },
];

const resumes = [
  { id: 'r1', title: 'Водитель категории C', city: 'Южно-Сахалинск', date: '2026-05-10', views: 45, status: 'active' },
  { id: 'r2', title: 'Сварщик 6 разряда', city: 'Корсаков', date: '2026-04-28', views: 23, status: 'active' },
];

const vacancies = [] as { id: string; title: string; company: string; city: string; date: string; salary: string }[];

const responses = [
  { id: 'resp1', vacancy: 'Водитель категории C', employer: 'ООО «СахалинТранс»', date: '2026-05-14', status: 'new' },
  { id: 'resp2', vacancy: 'Водитель категории C', employer: 'ИП Петров А.С.', date: '2026-05-12', status: 'viewed' },
];

const statusLabels: Record<string, string> = { new: 'Новый', viewed: 'Просмотрен' };

export default function AccountJobs() {
  const [activeTab, setActiveTab] = useState<TabId>('resumes');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="sakh-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sakh-tabs__item ${activeTab === tab.id ? 'sakh-tabs__item--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className="sakh-btn sakh-btn--primary sakh-btn--sm">
          + Создать
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {activeTab === 'resumes' && resumes.length > 0 ? resumes.map(r => (
            <div key={r.id} className="sakh-card p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">{r.title}</h4>
                <span className="sakh-tag sakh-tag--accent">Активно</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="sakh-meta sakh-meta--with-icon">
                  <MapPin size={10} />
                  {r.city}
                </span>
                <span className="sakh-meta sakh-meta--with-icon">
                  <Calendar size={10} />
                  {r.date}
                </span>
                <span className="sakh-meta sakh-meta--with-icon">
                  <Eye size={10} />
                  {r.views}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="sakh-btn sakh-btn--secondary sakh-btn--sm">Редактировать</button>
                <button className="sakh-btn sakh-btn--ghost sakh-btn--sm">В архив</button>
              </div>
            </div>
          )) : activeTab === 'vacancies' && vacancies.length > 0 ? vacancies.map(v => (
            <div key={v.id} className="sakh-card p-4">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">{v.title}</h4>
              <p className="text-sm text-[var(--text-secondary)] mb-2">{v.company}</p>
              <div className="flex items-center gap-3">
                <span className="sakh-meta sakh-meta--with-icon">
                  <MapPin size={10} />
                  {v.city}
                </span>
                <span className="sakh-meta">{v.salary}</span>
                <span className="sakh-meta">{v.date}</span>
              </div>
            </div>
          )) : activeTab === 'responses' && responses.length > 0 ? responses.map(r => (
            <div key={r.id} className="sakh-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mb-1">{r.vacancy}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">{r.employer}</p>
                </div>
                <span className={`sakh-tag ${r.status === 'new' ? 'sakh-tag--accent' : 'sakh-tag--muted'}`}>
                  {statusLabels[r.status]}
                </span>
              </div>
              <span className="sakh-meta">{r.date}</span>
            </div>
          )) : (
            <EmptyState
              title={
                activeTab === 'resumes' ? 'Нет резюме' :
                activeTab === 'vacancies' ? 'Нет вакансий' : 'Нет откликов'
              }
              description={
                activeTab === 'resumes' ? 'Создайте первое резюме' :
                activeTab === 'vacancies' ? 'Вы ещё не создали вакансий' : 'Откликов пока нет'
              }
              icon={<Briefcase size={48} />}
              action={<button className="sakh-btn sakh-btn--primary sakh-btn--sm">Создать</button>}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
