import {
  Controller,
  Get,
  NotFoundException,
  ParseUUIDPipe,
  Query,
  Param,
} from '@nestjs/common';
import { GetOwnedTextUseCase } from '../../application/use-cases/get-owned-text.use-case.js';
import { ListOwnedTextsUseCase } from '../../application/use-cases/list-owned-texts.use-case.js';
import { TextNotFoundError } from '../../application/errors/text-not-found.error.js';

@Controller('reader/texts')
export class ReaderController {
  constructor(
    private readonly listOwnedTexts: ListOwnedTextsUseCase,
    private readonly getOwnedText: GetOwnedTextUseCase,
  ) {}

  @Get()
  listTexts(@Query('userId', new ParseUUIDPipe()) userId: string) {
    return this.listOwnedTexts.execute(userId);
  }

  @Get(':textId')
  async getText(
    @Param('textId', new ParseUUIDPipe()) textId: string,
    @Query('userId', new ParseUUIDPipe()) userId: string,
  ) {
    try {
      return await this.getOwnedText.execute(userId, textId);
    } catch (error) {
      if (error instanceof TextNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }

  }
}
