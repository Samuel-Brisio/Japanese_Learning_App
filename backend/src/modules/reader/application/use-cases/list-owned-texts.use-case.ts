import { Inject, Injectable } from '@nestjs/common';
import { TEXT_REPOSITORY } from '../../domain/ports/text.repository.js';
import type { TextRepository } from '../../domain/ports/text.repository.js';
import { TextDetailDto } from '../dtos/text-detail.dto.js';
import {textDetailMapper} from '../mappers/text-detail.mapper.js';

@Injectable()
export class ListOwnedTextsUseCase {
  constructor(
    @Inject(TEXT_REPOSITORY)
    private readonly textRepository: TextRepository,
  ) {}

  async execute(ownerId: string): Promise<TextDetailDto[]> {
    const texts = await this.textRepository.findOwned(ownerId);
    return texts.map((text) => textDetailMapper(text));
  }
}
