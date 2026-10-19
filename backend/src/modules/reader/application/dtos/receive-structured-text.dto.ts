import { StructuredText } from "../../domain/models/text.entity.js";


export interface ReceiveStructuredTextDto {
  ownerId: string;
  processingId: string;
  text: StructuredText;
}
