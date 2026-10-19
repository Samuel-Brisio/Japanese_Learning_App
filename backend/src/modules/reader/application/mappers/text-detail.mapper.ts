import {TextDetailDto} from '../dtos/text-detail.dto.js';
import {Text} from '../../domain/models/text.entity.js';

export function textDetailMapper(text: Text): TextDetailDto {
  const textDetail: TextDetailDto = new TextDetailDto();
  textDetail.id = text.id;
  textDetail.text = text.text;
  textDetail.version = text.version;
  textDetail.createdAt = text.createdAt;
  textDetail.updatedAt = text.updatedAt;

  return textDetail;
}