import { Global, Module } from '@nestjs/common';
import { SearchIndexService } from './search-index.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SearchIndexService],
  exports: [SearchIndexService],
})
export class SearchIndexModule {}
