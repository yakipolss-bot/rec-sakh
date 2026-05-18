import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossService.name);
  private boss: any | null = null;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      this.logger.warn('DATABASE_URL not set — PgBoss disabled');
      return;
    }
    let PgBossCtor: any = null;
    try {
      const imported = await import('pg-boss');
      const pkg: any = imported as any;
      PgBossCtor = pkg.PgBoss ?? pkg.default ?? pkg;
      this.logger.log(`pg-boss module keys: ${Object.keys(pkg).join(', ')}`);
      this.logger.log(`pg-boss default present: ${!!pkg.default} typeof default: ${typeof pkg.default}`);
    } catch (err) {
      this.logger.warn('Failed to import pg-boss; queue disabled');
      return;
    }

    if (typeof PgBossCtor !== 'function') {
      this.logger.warn('PgBoss export is not constructable; queue disabled');
      return;
    }

    try {
      this.boss = new PgBossCtor({ connectionString });
    } catch (err) {
      this.logger.warn('Failed to construct PgBoss instance — queue disabled');
      this.boss = null;
      return;
    }

    try {
      await this.boss.start();
      this.logger.log('PgBoss started');
    } catch (e) {
      this.logger.warn('Failed to start PgBoss — queue disabled: ' + (e?.message ?? String(e)));
      this.boss = null;
    }
  }

  isRunning() {
    return this.boss !== null;
  }

  async publish(name: string, data?: any, options?: any) {
    if (!this.boss) throw new Error('PgBoss not started');
    return this.boss.publish(name, data, options);
  }

  async work(name: string, handler: (job: any) => Promise<any>, options?: any) {
    if (!this.boss) throw new Error('PgBoss not started');
    return this.boss.work(name, async (job: any) => {
      try {
        return await handler(job.data);
      } catch (err) {
        this.logger.error(`Job ${name} failed: ${(err as Error).message}`);
        throw err;
      }
    }, options);
  }

  async onModuleDestroy() {
    if (this.boss) {
      try {
        await this.boss.stop();
        this.logger.log('PgBoss stopped');
      } catch {
        // ignore
      }
    }
  }
}
