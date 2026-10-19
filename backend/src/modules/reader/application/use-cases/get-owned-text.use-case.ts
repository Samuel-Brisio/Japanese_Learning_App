import { Inject, Injectable } from '@nestjs/common';
import { TEXT_REPOSITORY } from '../../domain/ports/text.repository.js';
import type { TextRepository } from '../../domain/ports/text.repository.js';
import { TextDetailDto } from '../dtos/text-detail.dto.js';
import { TextNotFoundError } from '../errors/text-not-found.error.js';
import { textDetailMapper } from '../mappers/text-detail.mapper.js';

@Injectable()
export class GetOwnedTextUseCase {
  constructor(
    @Inject(TEXT_REPOSITORY)
    private readonly textRepository: TextRepository,
  ) {}

  async execute(ownerId: string, textId: string): Promise<TextDetailDto> {
    const text = await this.textRepository.findOwnedById(ownerId, textId);

    if (!text) {
      throw new TextNotFoundError();
    }

    const textDetail = textDetailMapper(text);

    return textDetail;
  }
}