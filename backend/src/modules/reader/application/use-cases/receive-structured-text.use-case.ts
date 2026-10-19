import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Text } from '../../domain/models/text.entity.js';
import { TextDetailDto } from '../dtos/text-detail.dto.js';
import { textDetailMapper } from '../mappers/text-detail.mapper.js';
import type {StructuredText } from '../../domain/models/text.entity.js'; 
import { TEXT_REPOSITORY } from '../../domain/ports/text.repository.js';
import type { TextRepository } from '../../domain/ports/text.repository.js';

export interface ReceiveStructuredTextCommand {
  ownerId: string;
  processingId: string;
  structuredText: StructuredText;
}

@Injectable()
export class ReceiveStructuredTextUseCase {
  constructor(
    @Inject(TEXT_REPOSITORY)
    private readonly textRepository: TextRepository,
  ) {}

  async execute(command: ReceiveStructuredTextCommand): Promise<TextDetailDto> {
    const text = Text.create({
      id: randomUUID(),
      ownerId: command.ownerId,
      processingId: command.processingId,
      text: command.structuredText,
    });

    await this.textRepository.save(text);
    return textDetailMapper(text);
  }

}

