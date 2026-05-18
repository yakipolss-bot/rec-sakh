import { TrendingUp, TrendingDown } from 'lucide-react';
import { currencyRates } from '@/data/mock';

export default function CurrencyWidget() {
  return (
    <div className="sakh-card p-4">
      <h3 className="sakh-caption mb-4">
        Курсы валют
      </h3>
      <div className="space-y-3">
        {currencyRates.map((rate) => (
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
        ))}
      </div>
      <p className="sakh-meta mt-3">
        ЦБ РФ, 16 мая 2026
      </p>
    </div>
  );
}
