import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { fetchCurrencyRates } from '@/services/currency.service';
import type { CurrencyRate } from '@/types';

function formatDate(date: Date): string {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function CurrencyWidget() {
  const [rates, setRates] = useState<CurrencyRate[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await fetchCurrencyRates();
      if (mounted) {
        setRates(data);
        setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="sakh-card p-4">
      <h3 className="sakh-caption mb-4">
        Курсы валют
      </h3>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />
          </div>
        ) : rates && rates.length > 0 ? (
          rates.map((rate) => (
            <div key={rate.code} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="sakh-tag sakh-tag--accent" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                  {rate.code}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {rate.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                  {rate.rate.toFixed(rate.code === 'JPY' || rate.code === 'KRW' ? 3 : 2)} ₽
                </span>
                <span className={`flex items-center gap-0.5 text-xs font-mono ${rate.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {rate.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {rate.change > 0 ? '+' : ''}{rate.change.toFixed(rate.code === 'JPY' || rate.code === 'KRW' ? 3 : 2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-center py-2" style={{ color: 'var(--text-secondary)' }}>Нет данных</p>
        )}
      </div>
      <p className="sakh-meta mt-3">
        ЦБ РФ, {formatDate(new Date())}
      </p>
    </div>
  );
}
