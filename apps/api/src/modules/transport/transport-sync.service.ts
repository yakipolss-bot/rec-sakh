import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service.js';

@Injectable()
export class TransportSyncService {
  private readonly logger = new Logger(TransportSyncService.name);

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

      const ferries = this.parseFerrySchedule(html);
      if (ferries.length === 0) {
        this.logger.warn('[Sync] No ferries parsed from sasco.ru');
        return;
      }

      await this.upsertFerries(ferries);
      this.logger.log(`[Sync] Updated ${ferries.length} ferry entries`);
    } catch (err) {
      this.logger.error(`[Sync] Ferry fetch failed: ${err}`);
    }
  }

  // ─── Airport parser ────────────────────────────────────────────

  private parseAirportBoard(html: string): AirportFlightData[] {
    const flights: AirportFlightData[] = [];

    // Helper: normalize status
    const normStatus = (s: string): string => {
      const st = s.trim().toLowerCase();
      if (st.includes('вылетел') || st.includes('прибыл')) return 'arrived';
      if (st.includes('посадк') || st.includes('регистраци')) return 'boarding';
      if (st.includes('задерж')) return 'delayed';
      if (st.includes('отмен')) return 'cancelled';
      return 'scheduled';
    };

    // Helper: extract city name from airline+city block
    const extractCity = (text: string): string => text.replace(/[«»"]/g, '').trim();

    // Actually parse: the airportus board has departure first, then arrival
    // We detect sections by looking at the flight table headers
    const sections = html.split(/<thead>/g);
    let sectionIdx = 0;
    for (const section of sections) {
      if (sectionIdx === 0) { sectionIdx++; continue; } // skip before first thead

      const type: 'departure' | 'arrival' = sectionIdx === 1 ? 'departure' : 'arrival';
      sectionIdx++;

      // Extract all rows from this section
      const rowMatches = section.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      for (const rowMatch of rowMatches) {
        const rowHtml = rowMatch[1];
        if (!rowHtml || rowHtml.includes('<th')) continue; // skip header rows

        const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
          m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        );

        if (cells.length < 4) continue;

        // cells[0] = flight number, cells[1] = airline, cells[2] = city
        // cells[3] = scheduled time, cells[4] = actual time, cells[5] = status
        const flightNum = cells[0].replace(/\s+/g, ' ').trim();
        const airline = cells[1] || null;
        const city = extractCity(cells[2] || '');

        // Time parsing — could be "09:00" or "22.05 09:00"
        const timeRaw = cells[3] || '';
        const timeMatch = timeRaw.match(/(\d{1,2})[.:](\d{2})/);
        let scheduledTime = timeRaw;
        if (timeMatch) {
          // Check if it has date prefix like "22.05 09:00" (future date)
          const datePrefix = timeRaw.match(/(\d{2}\.\d{2})\s+/);
          if (datePrefix) {
            scheduledTime = datePrefix[1] + ' ' + timeMatch[0];
          }
        }

        const actualTime = cells[4] || null;
        const rawStatus = cells[5] || '';
        const status = normStatus(rawStatus);

        // Determine departure vs arrival city based on type
        const isDeparture = type === 'departure';

        // For departures: city is the destination; for arrivals: city is the origin
        const departureCity = isDeparture ? 'Южно-Сахалинск (UUS)' : (city ? `${city}` : undefined);
        const arrivalCity = isDeparture ? (city ? `${city}` : undefined) : 'Южно-Сахалинск (UUS)';

        flights.push({
          flightNumber: flightNum,
          airline: airline || null,
          departureCity: departureCity || null,
          arrivalCity: arrivalCity || null,
          scheduledTime,
          actualTime,
          status,
          type,
        });
      }
    }

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

  // ─── Ferry parser ──────────────────────────────────────────────

  private parseFerrySchedule(html: string): FerryData[] {
    const ferries: FerryData[] = [];

    // The SASCO page has a specific structure for each vessel
    // Find each vessel section: <h3>Сахалин-X</h3>
    const vesselRegex = /<h3[^>]*>([^<]+)<\/h3>\s*<div[^>]*class="[^"]*ferry[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    let match: RegExpExecArray | null;

    while ((match = vesselRegex.exec(html)) !== null) {
      const vesselName = match[1].trim();
      const content = match[2];

      if (!content) continue;

      let currentPort = '';

      const portBlocks = content.split(/<div[^>]*class="[^"]*ferry-header[^"]*"[^>]*>/g);
      for (let i = 1; i < portBlocks.length; i++) {
        // The port name is in the first part before </div>
        const headerEnd = portBlocks[i].indexOf('</div>');
        if (headerEnd === -1) continue;
        currentPort = portBlocks[i].substring(0, headerEnd).replace(/<[^>]+>/g, '').trim();

        const portContent = portBlocks[i].substring(headerEnd + 6);

        // Extract arrival/departure times
        const times = [...portContent.matchAll(/(?:Приход|Отход)\s*\(?[^)]*\)?\s*([\d.]+)\s+([\d:]+)/gi)];
        for (const t of times) {
          const label = t[0].includes('Приход') ? 'arrival' : 'departure';
          const dateStr = t[1];
          const timeStr = t[2];

          const dateParts = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
          const timeParts = timeStr.match(/(\d{1,2})[.:](\d{2})/);
          if (!dateParts || !timeParts) continue;

          const d = parseInt(dateParts[1]), m = parseInt(dateParts[2]) - 1, y = parseInt(dateParts[3]);
          const h = parseInt(timeParts[1]), min = parseInt(timeParts[2]);

          const dt = new Date(y, m, d, h, min);

          // Determine route
          const route = 'Ванино-Холмск';
          const isVanino = /ванино/i.test(currentPort);
          const isKholmsk = /холмск/i.test(currentPort);
          const departurePort = isVanino ? 'Ванино' : isKholmsk ? 'Холмск' : currentPort;
          const arrivalPort = isVanino ? 'Холмск' : isKholmsk ? 'Ванино' : '';

          ferries.push({
            route,
            vesselName,
            departurePort,
            arrivalPort,
            departureTime: label === 'departure' ? dt : new Date(dt.getTime() - 18 * 60 * 60 * 1000),
            arrivalTime: label === 'arrival' ? dt : new Date(dt.getTime() + 18 * 60 * 60 * 1000),
            status: 'scheduled',
            date: new Date(y, m, d),
          });
        }
      }
    }

    // Fallback: use simpler regex if above didn't match
    if (ferries.length === 0) {
      // Direct table parsing
      const tableRegex = /<h3[^>]*>([^<]+)<\/h3>([\s\S]*?)(?=<h3|$)/gi;
      while ((match = tableRegex.exec(html)) !== null) {
        const vesselName = match[1].trim();
        const content = match[2];

        // Find all date-time entries
        const entries = [...content.matchAll(/([А-Яа-я]+)\s*\(?[^)]*\)?\s*((?:\d{2}\.){2}\d{4})\s+(\d{1,2}[:.]\d{2})/gi)];
        let currentPort = '';
        for (const entry of entries) {
          const label = entry[1].trim(); // Приход/Отход + port name
          const dateStr = entry[2];
          const timeStr = entry[3].replace('.', ':');

          if (label.includes('Ванино') || label.includes('Холмск')) {
            currentPort = label.includes('Ванино') ? 'Ванино' : 'Холмск';
          }

          const dateParts = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
          const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (!dateParts || !timeParts) continue;

          const d = parseInt(dateParts[1]), m = parseInt(dateParts[2]) - 1, y = parseInt(dateParts[3]);
          const h = parseInt(timeParts[1]), min = parseInt(timeParts[2]);
          const dt = new Date(y, m, d, h, min);

          const isDeparture = /отход/i.test(label);
          const isArrival = /приход/i.test(label) || /приход/i.test(html.substring(Math.max(0, entry.index - 50), entry.index));

          if (currentPort) {
            ferries.push({
              route: 'Ванино-Холмск',
              vesselName,
              departurePort: currentPort,
              arrivalPort: currentPort === 'Ванино' ? 'Холмск' : 'Ванино',
              departureTime: isDeparture || !isArrival ? dt : new Date(dt.getTime() - 18 * 60 * 60 * 1000),
              arrivalTime: isArrival ? dt : new Date(dt.getTime() + 18 * 60 * 60 * 1000),
              status: 'scheduled',
              date: new Date(y, m, d),
            });
          }
        }
      }
    }

    return ferries;
  }

  private async upsertFerries(ferries: FerryData[]) {
    // Upsert ferries by unique key (vesselName + departureTime)
    for (const f of ferries) {
      const existing = await this.prisma.transportFerry.findFirst({
        where: {
          vesselName: f.vesselName,
          departureTime: f.departureTime,
        },
      });

      if (existing) {
        await this.prisma.transportFerry.update({
          where: { id: existing.id },
          data: {
            status: f.status,
            departureTime: f.departureTime,
            arrivalTime: f.arrivalTime,
          },
        });
      } else {
        await this.prisma.transportFerry.create({ data: f });
      }
    }
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
