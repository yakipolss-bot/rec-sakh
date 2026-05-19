import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private _isConnected = false;

  get isConnected() {
    return this._isConnected;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this._isConnected = true;
      this.logger.log('Connected to database');
    } catch (err) {
      this.logger.error(
        `Database connection failed: ${(err as Error).message}. The app will start but DB queries will fail.`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // ignore
    }
  }
}
