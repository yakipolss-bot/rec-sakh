import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { AstvNewsScannerService } from './astv-scanner.service.js';

@Module({
  imports: [PrismaModule],
  providers: [AstvNewsScannerService],
})
export class NewsSyncModule {}
