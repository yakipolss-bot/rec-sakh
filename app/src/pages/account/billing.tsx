import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, Receipt, TrendingUp, ArrowUpRight, X, Loader2 } from 'lucide-react';
import billingService from '@/services/billing.service';
import type { Tariff, Transaction, Invoice, ActiveSubscription } from '@/services/billing.service';
import { toast } from 'sonner';

type TabId = 'overview' | 'transactions' | 'tariffs' | 'invoices';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'transactions', label: 'Транзакции' },
  { id: 'tariffs', label: 'Тарифы' },
  { id: 'invoices', label: 'Инвойсы' },
];

export default function AccountBilling() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [balance, setBalance] = useState<{ balance: number; currency: string } | null>(null);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const [bal, sub, txns, invs, tfs] = await Promise.all([
          billingService.getBalance().catch(() => null),
          billingService.getActiveSubscription().catch(() => null),
          billingService.getTransactions().catch(() => ({ data: [], meta: {} })),
          billingService.getInvoices().catch(() => ({ data: [], meta: {} })),
          billingService.getTariffs().catch(() => []),
        ]);
        if (!cancelled) {
          setBalance(bal);
          setActiveSub(sub);
          setTransactions(txns.data || []);
          setInvoices(invs.data || []);
          setTariffs(tfs);
        }
      } catch {
        toast.error('Ошибка загрузки данных биллинга');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }
    try {
      const result = await billingService.topUpBalance(amount, 'yookassa', window.location.href);
      if (result?.confirmation?.confirmation_url) {
        window.location.href = result.confirmation.confirmation_url;
      } else {
        toast.success('Запрос на пополнение создан');
        setTopUpAmount('');
      }
    } catch {
      toast.error('Ошибка при пополнении баланса');
    }
  };

  const handleSubscribe = async (tariffId: string) => {
    try {
      const result = await billingService.subscribe(tariffId);
      if (result?.confirmation?.confirmation_url) {
        window.location.href = result.confirmation.confirmation_url;
      } else {
        toast.success('Подписка оформлена');
      }
    } catch {
      toast.error('Ошибка при оформлении подписки');
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSub) return;
    try {
      await billingService.cancelSubscription(activeSub.id);
      setActiveSub({ ...activeSub, status: 'cancelled' });
      toast.success('Подписка отменена');
    } catch {
      toast.error('Ошибка при отмене подписки');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--accent-ocean)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string = 'RUB') =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sakh-tabs mb-4">
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
        >
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="sakh-card p-4 sm:p-5">
                <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
                  <Wallet size={16} className="text-[var(--accent-ocean)]" />
                  Баланс
                </h3>
                <p className="text-3xl font-mono font-bold text-[var(--text-primary)] mb-2">
                  {balance ? formatAmount(balance.balance, balance.currency) : '—'}
                </p>
                <div className="flex gap-2 mt-4">
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    placeholder="Сумма пополнения"
                    className="sakh-input flex-1"
                    min={1}
                  />
                  <button onClick={handleTopUp} className="sakh-btn sakh-btn--primary sakh-btn--sm">
                    <ArrowUpRight size={14} />
                    Пополнить
                  </button>
                </div>
              </div>

              {activeSub && (
                <div className="sakh-card p-4 sm:p-5">
                  <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--accent-ocean)]" />
                    Активная подписка
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">{activeSub.tariffName}</p>
                      <p className="sakh-meta text-xs">
                        Действует до {new Date(activeSub.endDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    {activeSub.status === 'active' && (
                      <button onClick={handleCancelSubscription} className="sakh-btn sakh-btn--outline sakh-btn--sm">
                        Отменить
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="sakh-card p-4 sm:p-5">
              <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
                <Receipt size={16} className="text-[var(--accent-ocean)]" />
                История транзакций
              </h3>
              {transactions.length === 0 ? (
                <p className="sakh-meta text-sm">Транзакций пока нет</p>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{tx.description}</p>
                        <p className="sakh-meta text-xs">
                          {new Date(tx.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={`text-sm font-mono font-medium ${tx.amount >= 0 ? 'text-green-500' : 'text-[var(--accent-sunset)]'}`}>
                          {tx.amount >= 0 ? '+' : ''}{formatAmount(tx.amount, tx.currency)}
                        </p>
                        <span className={`sakh-tag text-xs ${tx.status === 'completed' ? 'sakh-tag--accent' : ''}`}>
                          {tx.status === 'completed' ? 'Выполнено' : tx.status === 'pending' ? 'Ожидает' : tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tariffs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tariffs.length === 0 ? (
                <div className="sakh-card p-4 col-span-full">
                  <p className="sakh-meta text-sm">Тарифы пока не доступны</p>
                </div>
              ) : (
                tariffs.map(tariff => (
                  <div key={tariff.id} className="sakh-card p-4 sm:p-5 flex flex-col">
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">{tariff.name}</h3>
                    <p className="text-3xl font-mono font-bold text-[var(--accent-ocean)] mb-2">
                      {formatAmount(tariff.price, tariff.currency)}
                      <span className="text-sm font-normal text-[var(--text-muted)]">/{tariff.durationDays}д</span>
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">{tariff.description}</p>
                    <ul className="space-y-1.5 mb-6 flex-1">
                      {tariff.features.map((f, i) => (
                        <li key={i} className="text-sm text-[var(--text-primary)] flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSubscribe(tariff.id)}
                      className="sakh-btn sakh-btn--primary w-full"
                      disabled={!tariff.isActive}
                    >
                      {tariff.isActive ? 'Подписаться' : 'Недоступен'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="sakh-card p-4 sm:p-5">
              <h3 className="sakh-caption font-medium mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-[var(--accent-ocean)]" />
                Инвойсы
              </h3>
              {invoices.length === 0 ? (
                <p className="sakh-meta text-sm">Инвойсов пока нет</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)]">{inv.number}</p>
                        <p className="sakh-meta text-xs">{inv.description}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-mono font-medium text-[var(--text-primary)]">{formatAmount(inv.amount, inv.currency)}</p>
                        <span className={`sakh-tag text-xs ${inv.status === 'paid' ? 'sakh-tag--accent' : ''}`}>
                          {inv.status === 'paid' ? 'Оплачен' : inv.status === 'pending' ? 'Ожидает' : inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
