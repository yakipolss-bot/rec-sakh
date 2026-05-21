import { Module } from '@nestjs/common';
import { TransportController } from './transport.controller.js';
import { TransportService } from './transport.service.js';
import { TransportSyncService } from './transport-sync.service.js';

@Module({
  controllers: [TransportController],
  providers: [TransportService, TransportSyncService],
  exports: [TransportService],
})
export class TransportModule {}
