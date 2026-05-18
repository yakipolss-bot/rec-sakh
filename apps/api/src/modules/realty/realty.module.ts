import { Module } from '@nestjs/common';
import { RealtyController } from './realty.controller.js';
import { RealtyService } from './realty.service.js';

@Module({
  controllers: [RealtyController],
  providers: [RealtyService],
  exports: [RealtyService],
})
export class RealtyModule {}
