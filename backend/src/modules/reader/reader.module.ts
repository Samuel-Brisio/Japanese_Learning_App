import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module.js';
import { ReaderController } from './infrastructure/http/reader.controller.js';
// import { ReaderPublicationController } from './infrastructure/http/publication.controller.js';
import { TEXT_REPOSITORY } from './domain/ports/text.repository.js';
import { GetOwnedTextUseCase } from './application/use-cases/get-owned-text.use-case.js';
import { ListOwnedTextsUseCase } from './application/use-cases/list-owned-texts.use-case.js';
import { ReceiveStructuredTextUseCase } from './application/use-cases/receive-structured-text.use-case.js';
import { PrismaTextRepository } from './infrastructure/adapters/prisma-text.repository.js';

@Module({
  imports: [PrismaModule],
  // controllers: [ReaderController, ReaderPublicationController],
  controllers: [ReaderController],
  providers: [
    GetOwnedTextUseCase,
    ListOwnedTextsUseCase,
    ReceiveStructuredTextUseCase,
    PrismaTextRepository,
    {
      provide: TEXT_REPOSITORY,
      useExisting: PrismaTextRepository,
    },
  ],
})
export class ReaderModule {}
