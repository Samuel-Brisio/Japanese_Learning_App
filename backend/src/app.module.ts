import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module.js';
import { ReaderModule } from './modules/reader/reader.module.js';

@Module({
  imports: [PrismaModule, ReaderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
