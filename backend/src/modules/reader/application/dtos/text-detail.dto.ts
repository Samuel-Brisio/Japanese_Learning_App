import { StructuredText } from '../../domain/models/text.entity.js';

export class TextDetailDto {
  id: string;
  text: StructuredText;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}