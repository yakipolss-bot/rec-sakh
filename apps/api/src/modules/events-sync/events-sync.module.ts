import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { EventsSyncService } from './events-sync.service.js';

@Module({
  imports: [PrismaModule],
  providers: [EventsSyncService],
  exports: [EventsSyncService],
})
export class EventsSyncModule {}
