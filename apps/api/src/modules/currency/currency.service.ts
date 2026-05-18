import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';

const CBRF_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

const MOCK_RATES = [
  { code: 'USD', name: 'Доллар США', nominal: 1, value: 91.5678 },
  { code: 'EUR', name: 'Евро', nominal: 1, value: 99.1234 },
  { code: 'JPY', name: 'Японская иена', nominal: 100, value: 0.6005 },
  { code: 'KRW', name: 'Южнокорейская вона', nominal: 1000, value: 0.0665 },
  { code: 'CNY', name: 'Китайский юань', nominal: 1, value: 12.5678 },
  { code: 'GBP', name: 'Британский фунт', nominal: 1, value: 114.7890 },
  { code: 'KZT', name: 'Казахстанский тенге', nominal: 1, value: 0.1890 },
  { code: 'BYN', name: 'Белорусский рубль', nominal: 1, value: 28.3456 },
  { code: 'TRY', name: 'Турецкая лира', nominal: 1, value: 2.8345 },
];

const BANKS = [
  { bank: 'Сбербанк', logo: 'sberbank' },
  { bank: 'ВТБ', logo: 'vtb' },
  { bank: 'МТС Банк', logo: 'mts' },
  { bank: 'АТБ (Сахалин)', logo: 'atb' },
  { bank: 'Газпромбанк', logo: 'gazprom' },
  { bank: 'Россельхозбанк', logo: 'rshb' },
];

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    await this.ensureSeedData();

    const rates = await this.prisma.$queryRawUnsafe<Array<{
      code: string;
      name: string;
      nominal: number;
      value: number;
      time: Date;
    }>>(
      `SELECT DISTINCT ON (code) code, name, nominal, value, time
       FROM currency_rates
       ORDER BY code, time DESC`
    );

    return (rates as any[]).map((r) => ({
      code: r.code,
      name: r.name,
      nominal: r.nominal,
      buy: +(Number(r.value) * 0.98).toFixed(2),
      sell: +(Number(r.value) * 1.02).toFixed(2),
      updatedAt: r.time instanceof Date ? r.time.toISOString() : r.time,
    }));
  }

  async findByCode(code: string) {
    await this.ensureSeedData();

    const rate = await this.prisma.currencyRate.findFirst({
      where: { code: code.toUpperCase() },
      orderBy: { time: 'desc' },
    });

    if (!rate) {
      throw new NotFoundException(`Валюта "${code}" не найдена`);
    }

    const value = Number(rate.value);
    return {
      code: rate.code,
      name: rate.name,
      nominal: rate.nominal,
      buy: +(value * 0.98).toFixed(2),
      sell: +(value * 1.02).toFixed(2),
      updatedAt: rate.time.toISOString(),
    };
  }

  async getHistory(code: string, from?: string, to?: string) {
    await this.ensureSeedData();

    const upperCode = code.toUpperCase();
    const rate = await this.prisma.currencyRate.findFirst({
      where: { code: upperCode },
      orderBy: { time: 'desc' },
    });
    if (!rate) {
      throw new NotFoundException(`Валюта "${code}" не найдена`);
    }

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const toDate = to ? new Date(to) : new Date();

    const history = await this.prisma.currencyRate.findMany({
      where: {
        code: upperCode,
        time: { gte: fromDate, lte: toDate },
      },
      orderBy: { time: 'asc' },
      take: 90,
    });

    return {
      code: rate.code,
      name: rate.name,
      history: history.map((h) => ({
        date: h.time.toISOString().split('T')[0],
        value: Number(h.value),
      })),
    };
  }

  async convert(amount: number, from: string, to: string) {
    await this.ensureSeedData();

    const fromRate = await this.prisma.currencyRate.findFirst({
      where: { code: from.toUpperCase() },
      orderBy: { time: 'desc' },
    });
    const toRate = await this.prisma.currencyRate.findFirst({
      where: { code: to.toUpperCase() },
      orderBy: { time: 'desc' },
    });

    if (!fromRate) {
      throw new NotFoundException(`Валюта "${from}" не найдена`);
    }
    if (!toRate) {
      throw new NotFoundException(`Валюта "${to}" не найдена`);
    }

    // Convert through RUB: from -> RUB -> to
    const fromValueRub = Number(fromRate.value) / fromRate.nominal;
    const toValueRub = Number(toRate.value) / toRate.nominal;
    const result = (amount * fromValueRub) / toValueRub;

    return {
      amount,
      from,
      to,
      result: +result.toFixed(2),
      rate: +(fromValueRub / toValueRub).toFixed(6),
    };
  }

  async getBankRates() {
    await this.ensureSeedData();

    const rates = await this.prisma.$queryRawUnsafe<Array<{
      code: string;
      value: number;
    }>>(
      `SELECT DISTINCT ON (code) code, value
       FROM currency_rates
       ORDER BY code, time DESC`
    ) as any[];

    const usd = rates.find((r) => r.code === 'USD');
    const eur = rates.find((r) => r.code === 'EUR');
    const cny = rates.find((r) => r.code === 'CNY');

    const usdValue = usd ? Number(usd.value) : 91.57;
    const eurValue = eur ? Number(eur.value) : 99.12;
    const cnyValue = cny ? Number(cny.value) : 12.57;

    // Each bank has its own small spread variation
    const spread = (base: number, variation: number) => ({
      buy: +(base * (0.975 + variation)).toFixed(2),
      sell: +(base * (1.025 + variation)).toFixed(2),
    });

    return BANKS.map((b, i) => {
      const v = (i - 2) * 0.002; // slight variation per bank
      return {
        bank: b.bank,
        logo: b.logo,
        rates: {
          USD: spread(usdValue, v),
          EUR: spread(eurValue, v),
          CNY: spread(cnyValue, v),
        },
      };
    });
  }

  // --- External API Integration ---

  @Cron('0 0 12 * * *') // Every day at 12:00
  async fetchRatesFromAPI() {
    this.logger.log('[Currency] Starting scheduled rates fetch...');

    let success = false;
    success = await this.fetchFromCbrf();
    if (!success) {
      this.logger.warn('[Currency] CBRF API failed. Generating mock rates.');
      await this.generateMockRates();
    }
  }

  private async fetchFromCbrf(): Promise<boolean> {
    try {
      const res = await fetch(CBRF_URL);
      if (!res.ok) {
        this.logger.warn(`[Currency] CBRF responded with ${res.status}`);
        return false;
      }

      const data = await res.json() as any;
      const valutes = data.Valute as Record<string, any>;
      if (!valutes) return false;

      const now = new Date();
      let count = 0;

      for (const [code, info] of Object.entries(valutes)) {
        const value = info.Value ?? info.value;
        const nominal = info.Nominal ?? info.nominal ?? 1;
        const name = info.Name ?? info.name ?? code;

        if (value == null) continue;

        await this.prisma.currencyRate.create({
          data: {
            time: now,
            code,
            name,
            nominal,
            value,
            vunitRate: value / nominal,
            source: 'cbrf',
          },
        });
        count++;
      }

      this.logger.log(`[Currency] CBRF sync completed: ${count} rates saved`);
      return true;
    } catch (err) {
      this.logger.error(`[Currency] CBRF error: ${(err as Error).message}`);
      return false;
    }
  }

  private async generateMockRates(): Promise<void> {
    this.logger.log('[Currency] Generating mock rates...');
    const now = new Date();
    let count = 0;

    for (const rate of MOCK_RATES) {
      // Add slight daily variation
      const variation = (Math.random() - 0.5) * 2;
      const value = +(rate.value + variation).toFixed(4);

      await this.prisma.currencyRate.create({
        data: {
          time: now,
          code: rate.code,
          name: rate.name,
          nominal: rate.nominal,
          value,
          vunitRate: value / rate.nominal,
          source: 'mock',
        },
      });
      count++;
    }

    this.logger.log(`[Currency] Mock rates generated: ${count} rates`);
  }

  // --- Seed data if DB empty ---

  private async ensureSeedData(): Promise<void> {
    const count = await this.prisma.currencyRate.count();
    if (count > 0) return;

    this.logger.log('[Currency] No rates found, generating initial mock data...');
    await this.generateMockRates();
  }
}
