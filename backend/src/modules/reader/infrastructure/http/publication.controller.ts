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

@Controller('internal/api/v1/reader/texts/publication')
export class PublicationController {
  constructor(
    private readonly receiveStructuredTextUseCase: ReceiveStructuredTextUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePublication(@Body() dto: ReceiveStructuredTextDto) {
    const processingId = dto.processingId ?? dto.processing_id;

    if (!processingId) {
      throw new BadRequestException('processingId is required');
    }

    return this.receiveStructuredTextUseCase.execute({
      ownerId: dto.ownerId,
      processingId,
      structuredText: dto.text,
    });
  }
}