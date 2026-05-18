import { Global, Module } from '@nestjs/common';
import { SearchIndexService } from './search-index.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PgBossModule } from '../queue/pg-boss.module.js';
import { SearchQueueProcessor } from '../queue/search-queue.processor.js';

@Global()
@Module({
  imports: [PrismaModule, PgBossModule],
  providers: [SearchIndexService, SearchQueueProcessor],
  exports: [SearchIndexService],
})
export class SearchIndexModule {}
