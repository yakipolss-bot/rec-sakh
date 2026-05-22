import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { PDFParse } from 'pdf-parse';


@Injectable()
export class TransportSyncService {
  private readonly logger = new Logger(TransportSyncService.name);

  lastFlightsSync: Date | null = null;
  lastFerrySync: Date | null = null;
  lastFlightsCount = 0;
  lastFerryCount = 0;

  constructor(private prisma: PrismaService) {}

  @Cron('0 */15 * * * *') // Every 15 minutes
  async syncAirportFlights() {
    this.logger.log('[Sync] Fetching airport board from airportus.ru...');
    try {
      const html = await fetch('https://airportus.ru/board/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SakhcomBot/1.0)' },
      }).then((r) => r.text());

      const flights = this.parseAirportBoard(html);
      if (flights.length === 0) {
        this.logger.warn('[Sync] No flights parsed from airportus.ru');
        return;
      }

      await this.upsertFlights(flights);
      this.lastFlightsSync = new Date();
      this.lastFlightsCount = flights.length;
      this.logger.log(`[Sync] Updated ${flights.length} flights`);
    } catch (err) {
      this.logger.error(`[Sync] Airport fetch failed: ${err}`);
    }
  }

  @Cron('0 */30 * * * *') // Every 30 minutes
  async syncFerrySchedule() {
    this.logger.log('[Sync] Fetching ferry schedule from sasco.ru...');
    try {
      const html = await fetch('https://www.sasco.ru/service/ferry/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SakhcomBot/1.0)' },
      }).then((r) => r.text());

      // Extract PDF links from the page
      const pdfLinks = [...html.matchAll(/<a[^>]*href="([^"]+\.pdf)"[^>]*class="docs-list-item"[^>]*>/gi)]
        .map(m => m[1])
        .filter(h => h.includes('rasp_VHV'));

      if (pdfLinks.length === 0) {
        this.logger.warn('[Sync] No schedule PDFs found on sasco.ru');
        return;
      }

      const allFerries: FerryData[] = [];

      for (const link of pdfLinks) {
        const url = link.startsWith('http') ? link : `https://www.sasco.ru${link}`;
        this.logger.log(`[Sync] Downloading PDF: ${url}`);

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SakhcomBot/1.0)' },
        });
        const buf = Buffer.from(await res.arrayBuffer());

        const pdf = new PDFParse({ data: buf });
        const result = await pdf.getText();
        const text: string = result.text;

        const ferries = this.parseFerryPdf(text);
        allFerries.push(...ferries);
        this.logger.log(`[Sync] Parsed ${ferries.length} entries from ${url.split('/').pop()}`);
      }

      if (allFerries.length === 0) {
        this.logger.warn('[Sync] No ferry entries parsed from PDFs');
        return;
      }

      // Clear old ferry data and re-insert
      await this.prisma.transportFerry.deleteMany({});
      for (const f of allFerries) {
        await this.prisma.transportFerry.create({ data: f });
      }

      this.lastFerrySync = new Date();
      this.lastFerryCount = allFerries.length;
      this.logger.log(`[Sync] Updated ${allFerries.length} ferry entries from ${pdfLinks.length} PDFs`);
    } catch (err) {
      this.logger.error(`[Sync] Ferry fetch failed: ${err}`);
    }
  }

  // ─── Airport parser ────────────────────────────────────────────

  private parseAirportBoard(html: string): AirportFlightData[] {
    const flights: AirportFlightData[] = [];

    const normStatus = (s: string): string => {
      const st = s.trim().toLowerCase();
      if (st.includes('вылетел') || st.includes('прибыл')) return 'arrived';
      if (st.includes('посадк') || st.includes('регистраци')) return 'boarding';
      if (st.includes('задерж')) return 'delayed';
      if (st.includes('отмен')) return 'cancelled';
      return 'scheduled';
    };

    const airlineMap: Record<string, string> = {
      taiga: 'Таига',
      s7: 'S7 Airlines',
      aurora: 'Аврора',
      aeroflot: 'Аэрофлот',
      rus: 'Россия',
    };

    const depSection = html.match(/tab-page="departure"[\s\S]*?(?=tab-page="arrival"|$)/i)?.[0] || '';
    const arrSection = html.match(/tab-page="arrival"[\s\S]*?$/i)?.[0] || '';

    const parseSection = (section: string, type: 'departure' | 'arrival') => {
      const rowRegex = /<div\s+class="board-table__row\s*([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
      let rowMatch: RegExpExecArray | null;
      while ((rowMatch = rowRegex.exec(section)) !== null) {
        const rowClass = rowMatch[1];
        const rowHtml = rowMatch[2];
        if (!rowHtml || rowClass.includes('--head')) continue;

        const getItem = (n: number): string => {
          const m = rowHtml.match(new RegExp(`board-table__item--${n}[^>]*>([\\s\\S]*?)<\\/div>`));
          if (!m) return '';
          return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        };

        const item1 = getItem(1);
        const item2 = getItem(2);
        const item3 = getItem(3);
        const item4 = getItem(4);
        const item5 = getItem(5);
        const item6 = getItem(6);

        const flightNumMatch = item1.match(/<span[^>]*class="flight"[^>]*>([^<]+)<\/span>/i);
        const flightNum = flightNumMatch ? flightNumMatch[1].trim() : item1;

        const srcMatch = item2.match(/src="[^"]*\/([^/.]+)\./i);
        const airline = srcMatch ? (airlineMap[srcMatch[1]] || srcMatch[1]) : null;

        const city = item3.replace(/\s*<div.*$/s, '').trim();

        const timeRaw = item4.replace(/<[^>]+>/g, '').trim();
        const timeMatch = timeRaw.match(/(\d{1,2})[.:](\d{2})/);
        let scheduledTime = timeRaw;
        if (timeMatch) {
          const datePrefix = timeRaw.match(/(\d{2}\.\d{2})\s+/);
          scheduledTime = datePrefix ? datePrefix[1] + ' ' + timeMatch[0] : timeMatch[0];
        }

        const actualTime = item5.replace(/<[^>]+>/g, '').trim() || null;
        const rawStatus = item6.replace(/<[^>]+>/g, '').trim();
        const status = normStatus(rawStatus);

        const departureCity = type === 'departure' ? 'Южно-Сахалинск (UUS)' : city;
        const arrivalCity = type === 'arrival' ? 'Южно-Сахалинск (UUS)' : city;

        flights.push({
          flightNumber: flightNum,
          airline,
          departureCity: departureCity || null,
          arrivalCity: arrivalCity || null,
          scheduledTime,
          actualTime,
          status,
          type,
        });
      }
    };

    parseSection(depSection, 'departure');
    parseSection(arrSection, 'arrival');

    return flights;
  }

  private async upsertFlights(flights: AirportFlightData[]) {
    // Clear old flights for today and re-insert
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await this.prisma.transportFlight.deleteMany({
      where: { date: { gte: today, lt: tomorrow } },
    });

    for (const f of flights) {
      // Parse scheduled time
      let depTime: Date;
      let arrTime: Date;
      const timeStr = f.scheduledTime;

      if (timeStr.includes('.')) {
        // Format: "22.05 09:00" — has explicit date
        const parts = timeStr.match(/(\d{2})\.(\d{2})\s+(\d{1,2})[.:](\d{2})/);
        if (parts) {
          const d = parseInt(parts[1]), m = parseInt(parts[2]) - 1, h = parseInt(parts[3]), min = parseInt(parts[4]);
          depTime = new Date(today.getFullYear(), m, d, h, min);
          arrTime = new Date(depTime.getTime() + 3 * 60 * 60 * 1000); // +3h approx
        } else {
          depTime = new Date();
          arrTime = new Date();
        }
      } else {
        // Format: "09:00" — today
        const parts = timeStr.match(/(\d{1,2})[.:](\d{2})/);
        if (parts) {
          const h = parseInt(parts[1]), min = parseInt(parts[2]);
          depTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, min);
          arrTime = new Date(depTime.getTime() + 3 * 60 * 60 * 1000);
        } else {
          depTime = new Date();
          arrTime = new Date();
        }
      }

      await this.prisma.transportFlight.create({
        data: {
          flightNumber: f.flightNumber,
          airline: f.airline,
          departureCity: f.departureCity,
          arrivalCity: f.arrivalCity,
          departureTime: depTime,
          arrivalTime: arrTime,
          status: f.status,
          date: new Date(depTime.getFullYear(), depTime.getMonth(), depTime.getDate()),
        },
      });
    }
  }

  // ─── Ferry PDF parser ────────────────────────────────────────────

  private parseFerryPdf(text: string): FerryData[] {
    const ferries: FerryData[] = [];

    // Extract vessel name(s) from header
    const vesselHeaderMatch = text.match(/д\/э\s+"([^"]+)"(?:\s+д\/э\s+"([^"]+)")?/);
    const vessels: string[] = [];
    if (vesselHeaderMatch) {
      if (vesselHeaderMatch[1]) vessels.push(vesselHeaderMatch[1]);
      if (vesselHeaderMatch[2]) vessels.push(vesselHeaderMatch[2]);
    }
    if (vessels.length === 0) return [];

    const route = 'Ванино-Холмск';

    // Find the table data rows — dates in format DD.MM.YYYY
    const lines = text.split('\n');

    // Find the column header line: "приход отход приход отход ..."
    let dataStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/приход\s+отход/i.test(lines[i]) && lines[i].includes('приход') && lines[i].includes('отход')) {
        dataStart = i + 1;
        break;
      }
    }
    if (dataStart < 0) return [];

    // Collect all date rows (lines containing only dates and spaces)
    const dateRows: string[] = [];
    for (let i = dataStart; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Stop at line that doesn't look like date data
      if (!/^\d{2}\.\d{2}\.\d{4}/.test(line)) break;
      dateRows.push(line);
    }

    // Expected month per column group (0=апрель, 1=май, 2=июнь)
    const expectedMonths = [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5];

    // Parse each row: every row has date pairs for (Vanino_arr, Vanino_dep, Kholmsk_arr, Kholmsk_dep) × 3 months
    for (let ri = 0; ri < dateRows.length; ri++) {
      const rawDates = dateRows[ri].trim().split(/\s+/).map(d => {
        const parts = d.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (!parts) return null;
        return { day: parseInt(parts[1]), month: parseInt(parts[2]) - 1, year: parseInt(parts[3]) };
      }).filter((d): d is { day: number; month: number; year: number } => d !== null);

      if (rawDates.length < 8) continue;

      // Fix PDF artifacts: enforce expected month per column
      const dates: Date[] = rawDates.map((d, idx) => {
        const expMonth = idx < expectedMonths.length ? expectedMonths[idx] : d.month;
        // If extracted month is Jan (0) or differs from expected, use expected
        const month = (d.month === 0 || d.month !== expMonth) ? expMonth : d.month;
        return new Date(d.year, month, d.day);
      });

      for (let mi = 0; mi < 3 && mi * 4 + 3 < dates.length; mi++) {
        const vanDep = dates[mi * 4 + 1];
        const khlArr = dates[mi * 4 + 2];
        const khlDep = dates[mi * 4 + 3];

        for (const vesselName of vessels) {
          // Vanino → Kholmsk
          if (vanDep && khlArr) {
            const depDate = new Date(vanDep);
            depDate.setHours(8, 0, 0, 0);
            const arrDate = new Date(khlArr);
            // Arrival assumed ~18 hours later if same day, else use the date as-is
            if (arrDate.getTime() === depDate.getTime()) {
              arrDate.setHours(20, 0, 0, 0);
            } else {
              arrDate.setHours(8, 0, 0, 0);
            }
            ferries.push({
              route, vesselName,
              departurePort: 'Ванино', arrivalPort: 'Холмск',
              departureTime: depDate, arrivalTime: arrDate,
              status: 'scheduled',
              date: new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate()),
            });
          }

          // Kholmsk → Vanino (next row's Vanino arrival, or same row if this is the last row)
          if (khlDep) {
            let nextVanArr: Date | null = null;
            // Try next row for the same month
            if (ri + 1 < dateRows.length) {
              const nextDates = dateRows[ri + 1].trim().split(/\s+/).map(d => {
                const parts = d.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                if (!parts) return null;
                return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
              }).filter((d): d is Date => d !== null);
              if (mi * 4 < nextDates.length) {
                nextVanArr = nextDates[mi * 4];
              }
            }
            // Fallback: next month's first date in same row
            if (!nextVanArr && mi + 1 < 3 && (mi + 1) * 4 < dates.length) {
              nextVanArr = dates[(mi + 1) * 4];
            }

            if (nextVanArr) {
              const depDate = new Date(khlDep);
              depDate.setHours(8, 0, 0, 0);
              const arrDate = new Date(nextVanArr);
              arrDate.setHours(8, 0, 0, 0);
              ferries.push({
                route, vesselName,
                departurePort: 'Холмск', arrivalPort: 'Ванино',
                departureTime: depDate, arrivalTime: arrDate,
                status: 'scheduled',
                date: new Date(depDate.getFullYear(), depDate.getMonth(), depDate.getDate()),
              });
            }
          }
        }
      }
    }

    return ferries;
  }

}

interface AirportFlightData {
  flightNumber: string;
  airline: string | null;
  departureCity: string | null;
  arrivalCity: string | null;
  scheduledTime: string;
  actualTime: string | null;
  status: string;
  type: 'departure' | 'arrival';
}

interface FerryData {
  route: string;
  vesselName: string;
  departurePort: string;
  arrivalPort: string;
  departureTime: Date;
  arrivalTime: Date;
  status: string;
  date: Date;
}
