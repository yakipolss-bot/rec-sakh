import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { NewsModule } from './modules/news/news.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { AdsModule } from './modules/ads/ads.module.js';
import { JobsModule } from './modules/jobs/jobs.module.js';
import { RealtyModule } from './modules/realty/realty.module.js';
import { DirectoryModule } from './modules/directory/directory.module.js';
import { TagsModule } from './modules/tags/tags.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { WeatherModule } from './modules/weather/weather.module.js';
import { CurrencyModule } from './modules/currency/currency.module.js';
import { TransportModule } from './modules/transport/transport.module.js';
import { RecommendationsModule } from './modules/recommendations/recommendations.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 60, // секунд
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    NewsModule,
    CategoriesModule,
    EventsModule,
    AdsModule,
    JobsModule,
    RealtyModule,
    DirectoryModule,
    TagsModule,
    CommentsModule,
    SearchModule,
    WeatherModule,
    CurrencyModule,
    TransportModule,
    RecommendationsModule,
    NotificationsModule,
    BillingModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
