import { StructuredText } from "../../domain/models/text.entity.js";


export interface ReceiveStructuredTextDto {
  ownerId: string;
  processingId?: string;
  processing_id?: string;
  operation: 'PUBLISH' | 'REPLACE';
  attemptNumber?: number;
  textId?: string | null;
  expectedVersion?: number | null;
  text: StructuredText;
}
