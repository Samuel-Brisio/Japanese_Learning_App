import { Text } from '../models/text.entity.js';

export const TEXT_REPOSITORY = Symbol('TEXT_REPOSITORY');

export interface TextRepository {
  save(text: Text): Promise<void>;
  findOwned(ownerId: string): Promise<Text[]>;
  findOwnedById(ownerId: string, textId: string): Promise<Text | null>;
}
