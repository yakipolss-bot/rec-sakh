import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NewsController } from './news.controller.js';
import { NewsService } from './news.service.js';

@Module({
  imports: [ScheduleModule],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
