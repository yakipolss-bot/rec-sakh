import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, Bitcoin, CheckCircle, XCircle, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { billingOperations } from '@/data/accountMock';
import EmptyState from '@/components/EmptyState';

type TabId = 'operations' | 'subscriptions' | 'invoices';

const tabs: { id: TabId; label: string }[] = [
  { id: 'operations', label: 'Операции' },
  { id: 'subscriptions', label: 'Подписки' },
  { id: 'invoices', label: 'Счета' },
];

const statusIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle size={14} className="text-[var(--accent-ocean)]" />,
  pending: <Clock size={14} className="text-[var(--accent-sunset)]" />,
  failed: <XCircle size={14} className="text-[var(--accent-sunset)]" />,
};

const typeLabels: Record<string, string> = {
  payment: 'Пополнение',
  withdrawal: 'Списание',
  subscription: 'Подписка',
};

const methodLabels: Record<string, string> = {
  card: 'Карта',
  sbp: 'СБП',
  crypto: 'Крипта',
  system: 'Система',
};

export default function AccountBilling() {
  const [activeTab, setActiveTab] = useState<TabId>('operations');
  const balance = 851;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="sakh-card p-4 sm:p-5">
        <p className="sakh-caption mb-2">Текущий баланс</p>
        <p className="text-3xl sm:text-4xl font-mono font-medium text-[var(--accent-ocean)] mb-4">
          {balance} ₽
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="sakh-btn sakh-btn--primary sakh-btn--sm">
            <CreditCard size={14} />
            Карта
          </button>
          <button className="sakh-btn sakh-btn--secondary sakh-btn--sm">
            <Wallet size={14} />
            СБП
          </button>
          <button className="sakh-btn sakh-btn--secondary sakh-btn--sm">
            <Bitcoin size={14} />
            Крипта
          </button>
        </div>
      </div>

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

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {activeTab === 'operations' && (
            billingOperations.length > 0 ? (
              <div className="sakh-card">
                <div className="divide-y divide-[var(--border-color)]">
                  {billingOperations.map(op => (
                    <div key={op.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className={`${op.amount > 0 ? 'text-[var(--accent-ocean)]' : 'text-[var(--accent-sunset)]'}`}>
                          {op.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </span>
                        <div>
                          <p className="text-sm text-[var(--text-primary)]">{op.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="sakh-meta text-xs">{typeLabels[op.type]}</span>
                            <span className="sakh-meta text-xs">{methodLabels[op.method]}</span>
                            <span className="sakh-meta text-xs">{op.date.slice(0, 10)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono ${op.amount > 0 ? 'text-[var(--accent-ocean)]' : 'text-[var(--text-primary)]'}`}>
                          {op.amount > 0 ? '+' : ''}{op.amount} ₽
                        </span>
                        {statusIcons[op.status]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Нет операций" description="История операций пуста" icon={<CreditCard size={48} />} />
            )
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-3">
              <div className="sakh-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--text-primary)]">Бесплатный</h4>
                    <p className="sakh-meta text-xs">Базовый доступ ко всем разделам</p>
                  </div>
                  <span className="sakh-tag sakh-tag--accent">Текущий</span>
                </div>
                <p className="text-lg font-mono font-medium text-[var(--text-primary)]">0 ₽/мес</p>
              </div>
              <div className="sakh-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-[var(--text-primary)]">Премиум</h4>
                    <p className="sakh-meta text-xs">Без рекламы, приоритетная модерация, расширенная статистика</p>
                  </div>
                  <button className="sakh-btn sakh-btn--secondary sakh-btn--sm">Подключить</button>
                </div>
                <p className="text-lg font-mono font-medium text-[var(--accent-ocean)]">299 ₽/мес</p>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <EmptyState title="Нет счетов" description="Счета пока не выставлялись" icon={<CreditCard size={48} />} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
