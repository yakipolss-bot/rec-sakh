import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, RotateCcw, FileText, Clock,
  CheckCircle,
} from 'lucide-react';
import { transactions, tariffs } from '@/data/adminMock';

type BillingTab = 'transactions' | 'refunds' | 'reports' | 'tariffs';

const tabs: { key: BillingTab; label: string }[] = [
  { key: 'transactions', label: 'Транзакции' },
  { key: 'refunds', label: 'Возвраты' },
  { key: 'reports', label: 'Отчёты' },
  { key: 'tariffs', label: 'Тарифы' },
];

const typeLabels: Record<string, string> = {
  payment: 'Оплата',
  refund: 'Возврат',
  withdrawal: 'Вывод',
};

const typeBadge: Record<string, string> = {
  payment: 'sakh-tag--accent',
  refund: 'sakh-tag--sunset',
  withdrawal: 'sakh-tag--outline',
};

const statusBadge: Record<string, string> = {
  success: 'sakh-tag--accent',
  pending: 'sakh-tag--outline',
  failed: 'sakh-tag--sunset',
};

const statusLabels: Record<string, string> = {
  success: 'Успешно',
  pending: 'В обработке',
  failed: 'Ошибка',
};

const refunds = transactions.filter(t => t.type === 'refund');

const reportsData = (() => {
  const successfulPayments = transactions.filter(t => t.type === 'payment' && t.status === 'success');
  const successfulRefunds = transactions.filter(t => t.type === 'refund' && t.status === 'success');
  const pending = transactions.filter(t => t.status === 'pending');
  return {
    totalRevenue: successfulPayments.reduce((s, t) => s + t.amount, 0),
    totalRefunds: successfulRefunds.reduce((s, t) => s + t.amount, 0),
    netRevenue: successfulPayments.reduce((s, t) => s + t.amount, 0) - successfulRefunds.reduce((s, t) => s + t.amount, 0),
    pendingAmount: pending.reduce((s, t) => s + t.amount, 0),
  };
})();

export default function AdminBilling() {
  const [tab, setTab] = useState<BillingTab>('transactions');

  return (
    <div className="space-y-6">
      <h1 className="sakh-heading">Финансы</h1>

      <div className="sakh-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`sakh-tabs__item ${tab === t.key ? 'sakh-tabs__item--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'transactions' || tab === 'refunds') && (
        <div className="overflow-x-auto">
          <table className="sakh-table w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Дата</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Пользователь</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Тип</th>
                <th className="text-right py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Сумма</th>
                <th className="text-left py-3 px-3 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">Метод</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {(tab === 'transactions' ? transactions : refunds).map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-primary)]">{t.date}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)] font-mono text-xs">{t.user}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${typeBadge[t.type]}`}>{typeLabels[t.type]}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-right text-[var(--text-primary)]">
                    {t.type === 'refund' ? '−' : ''}{t.amount.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-[var(--text-secondary)]">{t.method}</td>
                  <td className="py-3 px-3">
                    <span className={`sakh-tag ${statusBadge[t.status]}`}>{statusLabels[t.status]}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: CreditCard, label: 'Доход', value: reportsData.totalRevenue.toLocaleString('ru-RU'), suffix: ' ₽' },
            { icon: RotateCcw, label: 'Возвраты', value: reportsData.totalRefunds.toLocaleString('ru-RU'), suffix: ' ₽' },
            { icon: FileText, label: 'Чистая прибыль', value: reportsData.netRevenue.toLocaleString('ru-RU'), suffix: ' ₽' },
            { icon: Clock, label: 'В обработке', value: reportsData.pendingAmount.toLocaleString('ru-RU'), suffix: ' ₽' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[var(--accent-ocean-20)]">
                  <stat.icon size={18} className="text-[var(--accent-ocean)]" />
                </div>
                <span className="sakh-caption">{stat.label}</span>
              </div>
              <p className="sakh-title text-xl">{stat.value}{stat.suffix}</p>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'tariffs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tariffs.map((tr, i) => (
            <motion.div
              key={tr.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="sakh-card p-5 flex flex-col"
            >
              <div className="mb-4">
                <span className="sakh-caption text-[var(--text-muted)]">{tr.interval}</span>
                <h3 className="sakh-title text-lg mt-1">{tr.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-2xl font-mono font-bold text-[var(--accent-ocean)]">
                  {tr.price === 0 ? 'Бесплатно' : `${tr.price.toLocaleString('ru-RU')} ₽`}
                </span>
                {tr.price > 0 && <span className="text-xs font-mono text-[var(--text-muted)] ml-1">/{tr.interval}</span>}
              </div>
              <ul className="space-y-2 flex-1">
                {tr.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                    <CheckCircle size={12} className="text-[var(--accent-ocean)] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="sakh-btn sakh-btn--primary sakh-btn--sm mt-5 w-full">
                {tr.price === 0 ? 'Текущий тариф' : 'Выбрать'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
