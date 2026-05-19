import type { CurrencyRate } from '@/types';

interface CbrValute {
  CharCode: string;
  Nominal: number;
  Name: string;
  Value: number;
  Previous: number;
}

interface CbrResponse {
  Date: string;
  Valute: Record<string, CbrValute>;
}

interface CacheEntry {
  data: CurrencyRate[];
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000;

const CURRENCY_MAP: Record<string, { code: string; name: string }> = {
  USD: { code: 'USD', name: 'Доллар США' },
  JPY: { code: 'JPY', name: 'Японская иена' },
  KRW: { code: 'KRW', name: 'Южнокорейская вона' },
  CNY: { code: 'CNY', name: 'Китайский юань' },
  EUR: { code: 'EUR', name: 'Евро' },
};

function parseRate(valute: CbrValute): number {
  return valute.Value / valute.Nominal;
}

function parseChange(valute: CbrValute): number {
  return (valute.Value - valute.Previous) / valute.Nominal;
}

export async function fetchCurrencyRates(): Promise<CurrencyRate[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  try {
    const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
      cache: 'no-cache',
    });

    if (!res.ok) {
      throw new Error(`CBR API error: ${res.status}`);
    }

    const json: CbrResponse = await res.json();
    const valutes = json.Valute;

    const rates = Object.keys(CURRENCY_MAP)
      .filter((code) => valutes[code])
      .map((code) => {
        const v = valutes[code];
        const info = CURRENCY_MAP[code];
        return {
          code: info.code,
          name: info.name,
          rate: parseRate(v),
          change: parseChange(v),
        };
      });

    cache = { data: rates, timestamp: Date.now() };
    return rates;
  } catch {
    if (cache) {
      return cache.data;
    }
    return [];
  }
}

export function generateHistory(currentRate: number, days = 7): { date: string; rate: number }[] {
  const history: { date: string; rate: number }[] = [];
  const now = new Date();
  let rate = currentRate;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (i < days - 1) {
      const drift = (Math.random() - 0.5) * 0.02;
      const prevRate = rate;
      rate = prevRate * (1 - drift);
    }

    history.push({ date: dayStr, rate: Math.round(rate * 100) / 100 });
  }

  return history;
}
