import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PgBossService } from './pg-boss.service.js';
import { SearchIndexService } from '../search/search-index.service.js';

@Injectable()
export class SearchQueueProcessor implements OnModuleInit {
  private readonly logger = new Logger(SearchQueueProcessor.name);

  constructor(private readonly pgBoss: PgBossService, private readonly searchIndex: SearchIndexService) {}

  async onModuleInit() {
    // Wait briefly for PgBoss to initialize (it may start a bit after module init)
    const waitForPgBoss = async (timeout = 10000, interval = 200) => {
      const start = Date.now();
      while (!this.pgBoss.isRunning() && Date.now() - start < timeout) {
        this.logger.log('Waiting for PgBoss to start...');
        await new Promise((r) => setTimeout(r, interval));
      }
      return this.pgBoss.isRunning();
    };

    const started = await waitForPgBoss();
    if (!started) {
      this.logger.log('PgBoss not running — search queue processor disabled');
      return;
    }

    // Full sync
    await this.pgBoss.work('typesense:syncAll', async () => {
      this.logger.log('Processing typesense:syncAll');
      await this.searchIndex.performSyncAll();
    });

    // Sync specific collections
    await this.pgBoss.work('typesense:syncNews', async (data: { ids?: string[] }) => {
      this.logger.log('Processing typesense:syncNews');
      await this.searchIndex.performSyncNews(data?.ids);
    });

    await this.pgBoss.work('typesense:syncEvents', async (data: { ids?: string[] }) => {
      this.logger.log('Processing typesense:syncEvents');
      await this.searchIndex.performSyncEvents(data?.ids);
    });

    await this.pgBoss.work('typesense:syncAds', async (data: { ids?: string[] }) => {
      this.logger.log('Processing typesense:syncAds');
      await this.searchIndex.performSyncAds(data?.ids);
    });

    await this.pgBoss.work('typesense:syncJobs', async (data: { ids?: string[] }) => {
      this.logger.log('Processing typesense:syncJobs');
      await this.searchIndex.performSyncJobs(data?.ids);
    });

    await this.pgBoss.work('typesense:syncDirectory', async (data: { ids?: string[] }) => {
      this.logger.log('Processing typesense:syncDirectory');
      await this.searchIndex.performSyncDirectory(data?.ids);
    });

    // Single document index
    await this.pgBoss.work('typesense:indexNews', async (data: { article: any }) => {
      this.logger.log(`Processing typesense:indexNews ${data?.article?.id}`);
      await this.searchIndex.performIndexNews(data.article);
    });

    this.logger.log('Search queue processor initialized');
  }
}
