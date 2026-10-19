import { createHash } from 'crypto';
import type { ReceiveStructuredTextDto } from '../dtos/receive-structured-text.dto.js';

export function createPublicationFingerprint(dto: ReceiveStructuredTextDto): string {
  const normalizedPayload = {
    operation: dto.operation,
    textId: dto.textId ?? null,
    expectedVersion: dto.expectedVersion ?? null,
    ownerId: dto.ownerId,
    text: dto.text,
  };

  return createHash('sha256')
    .update(JSON.stringify(normalizedPayload))
    .digest('hex');
}