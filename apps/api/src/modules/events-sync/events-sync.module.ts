import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { EventsSyncService } from './events-sync.service.js';
import { Afisha65ScannerService } from './afisha65-scanner.service.js';

@Module({
  imports: [PrismaModule],
  providers: [EventsSyncService, Afisha65ScannerService],
  exports: [EventsSyncService],
})
export class EventsSyncModule {}
