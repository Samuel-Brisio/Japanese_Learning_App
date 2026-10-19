import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Text } from '../../domain/models/text.entity.js';
import { TextDetailDto } from '../dtos/text-detail.dto.js';
import { textDetailMapper } from '../mappers/text-detail.mapper.js';
import type { StructuredText } from '../../domain/models/text.entity.js';
import { TEXT_REPOSITORY } from '../../domain/ports/text.repository.js';
import type { TextRepository } from '../../domain/ports/text.repository.js';
import { InvalidPublicationError } from '../errors/invalid-publication.error.js';

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
    let text: Text;

    try {
      text = Text.create({
        id: randomUUID(),
        ownerId: command.ownerId,
        processingId: command.processingId,
        text: command.structuredText,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidPublicationError(error.message);
      }

      throw error;
    }

    await this.textRepository.save(text);
    return textDetailMapper(text);
  }
}
