import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

interface PgBossInstance {
  start(): Promise<void>;
  stop(): Promise<void>;
  publish(name: string, data?: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
  work(name: string, handler: (job: { data: Record<string, unknown> }) => Promise<unknown>, options?: Record<string, unknown>): Promise<unknown>;
}

@Injectable()
export class PgBossService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PgBossService.name);
  private boss: PgBossInstance | null = null;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      this.logger.warn('DATABASE_URL not set — PgBoss disabled');
      return;
    }
    let PgBossCtor: (new (config: { connectionString: string }) => PgBossInstance) | null = null;
    try {
      const imported = await import('pg-boss');
      const pkg = imported as Record<string, unknown>;
      PgBossCtor = (pkg.PgBoss ?? pkg.default ?? pkg) as new (config: { connectionString: string }) => PgBossInstance;
      this.logger.log(`pg-boss module keys: ${Object.keys(pkg).join(', ')}`);
      this.logger.log(`pg-boss default present: ${!!pkg.default} typeof default: ${typeof pkg.default}`);
    } catch {
      this.logger.warn('Failed to import pg-boss; queue disabled');
      return;
    }

    if (typeof PgBossCtor !== 'function') {
      this.logger.warn('PgBoss export is not constructable; queue disabled');
      return;
    }

    try {
      this.boss = new PgBossCtor({ connectionString });
    } catch {
      this.logger.warn('Failed to construct PgBoss instance — queue disabled');
      this.boss = null;
      return;
    }

    try {
      await this.boss!.start();
      this.logger.log('PgBoss started');
    } catch (e) {
      this.logger.warn('Failed to start PgBoss — queue disabled: ' + ((e as Error)?.message ?? String(e)));
      this.boss = null;
    }
  }

  isRunning() {
    return this.boss !== null;
  }

  async publish(name: string, data?: Record<string, unknown>, options?: Record<string, unknown>) {
    if (!this.boss) throw new Error('PgBoss not started');
    return this.boss.publish(name, data, options);
  }

  async work(name: string, handler: (data: Record<string, unknown>) => Promise<unknown>, options?: Record<string, unknown>) {
    if (!this.boss) throw new Error('PgBoss not started');
    return this.boss.work(name, async (job: { data: Record<string, unknown> }) => {
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
