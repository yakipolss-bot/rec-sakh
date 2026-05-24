import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, ArrowRightLeft, Loader2 } from 'lucide-react';
import currencyService from '@/services/currency.service';
import type { CurrencyRate } from '@/types';
import SEOHead from '@/components/SEOHead';

const FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  JPY: '🇯🇵',
  KRW: '🇰🇷',
  CNY: '🇨🇳',
  EUR: '🇪🇺',
};

export default function CurrencyPage() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('RUB');
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRates = async () => {
    try {
      setLoading(true);
      const data = await currencyService.getRates();
      if (data.length > 0) {
        setRates(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const history = useMemo(() => rates.length > 0
    ? currencyService.generateHistory(rates.find(r => r.code === 'USD')?.rate ?? 0)
    : [], [rates]);

  const getRate = (code: string) => {
    if (code === 'RUB') return 1;
    const found = rates.find(r => r.code === code);
    return found?.rate || 0;
  };

  const converted = fromCurrency === toCurrency
    ? parseFloat(amount || '0')
    : (parseFloat(amount || '0') * getRate(fromCurrency)) / getRate(toCurrency);

  return (
    <div className="pt-20 pb-8">
      <SEOHead title="Курсы валют | Сахалин" description="Курс рубля, доллара, евро в Южно-Сахалинске." />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Курсы валют</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Курсы валют</h1>
          <p className="sakh-body">Курсы ЦБ РФ на сегодня</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="sakh-card overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="sakh-caption text-left p-4">Валюта</th>
                      <th className="sakh-caption text-right p-4">Курс</th>
                      <th className="sakh-caption text-right p-4">Изменение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && rates.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center">
                          <Loader2 size={20} className="inline animate-spin text-[var(--accent-ocean)]" />
                        </td>
                      </tr>
                    )}
                    {rates.map((rate) => (
                      <tr
                        key={rate.code}
                        className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-primary)] transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{FLAGS[rate.code]}</span>
                            <div>
                              <div className="text-sm font-medium text-[var(--text-primary)]">{rate.code}</div>
                              <div className="sakh-caption">{rate.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-lg font-medium text-[var(--text-primary)]">
                          {rate.rate.toFixed(2)} ₽
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={`sakh-meta font-medium ${rate.change >= 0 ? 'text-[#34D399]' : 'text-[var(--accent-sunset)]'}`}
                          >
                            {rate.change >= 0 ? (
                              <TrendingUp size={14} className="inline mr-1" />
                            ) : (
                              <TrendingDown size={14} className="inline mr-1" />
                            )}
                            {rate.change >= 0 ? '+' : ''}{rate.change.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="sakh-card p-4"
            >
              <h3 className="sakh-caption mb-4">График динамики USD</h3>
              <div className="bg-[var(--bg-primary)] p-4 border border-[var(--border-color)]">
                {loading && history.length === 0 ? (
                  <div className="flex items-center justify-center" style={{ height: 160 }}>
                    <Loader2 size={20} className="animate-spin text-[var(--accent-ocean)]" />
                  </div>
                ) : (
                  <div className="flex items-end gap-1" style={{ height: 160 }}>
                    {history.length > 0 && history.map((point, i) => {
                      const min = Math.min(...history.map(p => p.rate));
                      const max = Math.max(...history.map(p => p.rate));
                      const h = ((point.rate - min) / (max - min)) * 140;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="sakh-caption text-[10px]">{point.rate.toFixed(1)}</span>
                          <div
                            className="w-full bg-[var(--accent-ocean)] transition-all"
                            style={{ height: `${Math.max(h, 4)}px`, opacity: 0.6 + (i / history.length) * 0.4 }}
                          />
                          <span className="sakh-caption text-[10px]">{point.date}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="sakh-card p-4 sticky top-24"
            >
              <h3 className="sakh-caption mb-4">
                <ArrowRightLeft size={14} className="inline mr-1" />
                Конвертер
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="sakh-caption block mb-1">Сумма</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="sakh-input"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="sakh-caption block mb-1">Из</label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="sakh-select"
                  >
                    <option value="USD">{FLAGS.USD} USD</option>
                    <option value="JPY">{FLAGS.JPY} JPY</option>
                    <option value="KRW">{FLAGS.KRW} KRW</option>
                    <option value="CNY">{FLAGS.CNY} CNY</option>
                    <option value="EUR">{FLAGS.EUR} EUR</option>
                    <option value="RUB">🇷🇺 RUB</option>
                  </select>
                </div>

                <div>
                  <label className="sakh-caption block mb-1">В</label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="sakh-select"
                  >
                    <option value="USD">{FLAGS.USD} USD</option>
                    <option value="JPY">{FLAGS.JPY} JPY</option>
                    <option value="KRW">{FLAGS.KRW} KRW</option>
                    <option value="CNY">{FLAGS.CNY} CNY</option>
                    <option value="EUR">{FLAGS.EUR} EUR</option>
                    <option value="RUB">🇷🇺 RUB</option>
                  </select>
                </div>

                <div className="bg-[var(--bg-primary)] p-4 text-center border border-[var(--border-color)]">
                  <div className="sakh-caption mb-1">Результат</div>
                  <div className="text-2xl font-mono font-bold text-[var(--accent-ocean)]">
                    {isNaN(converted) ? '0' : converted.toFixed(2)}
                  </div>
                  <div className="sakh-meta">{toCurrency}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
