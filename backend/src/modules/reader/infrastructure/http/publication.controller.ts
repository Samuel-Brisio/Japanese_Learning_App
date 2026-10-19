import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import type { ReceiveStructuredTextDto } from './dtos/receive-structured-text.dto.js';
import { ReceiveStructuredTextUseCase } from '../../application/use-cases/receive-structured-text.use-case.js';
import { InvalidPublicationError } from '../../application/errors/invalid-publication.error.js';
import { UserNotFoundError } from '../../application/errors/user-not-found.error.js';

@Controller('internal/api/v1/reader/texts/publication')
export class PublicationController {
  constructor(
    private readonly receiveStructuredTextUseCase: ReceiveStructuredTextUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePublication(@Body() dto: ReceiveStructuredTextDto) {
    const processingId = dto.processingId;

    if (!processingId) {
      throw new BadRequestException('processingId is required');
    }

    try {
      return await this.receiveStructuredTextUseCase.execute({
        ownerId: dto.ownerId,
        processingId,
        structuredText: dto.text,
      });
    } catch (error) {
      if (error instanceof InvalidPublicationError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof UserNotFoundError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
