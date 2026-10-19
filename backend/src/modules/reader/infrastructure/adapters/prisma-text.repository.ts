import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service.js';
import { Text } from '../../domain/models/text.entity.js';
import { TextRepository } from '../../domain/ports/text.repository.js';

const textSelect = {
  id: true,
  ownerId: true,
  processingId: true,
  originalContent: true,
  elements: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PersistedText = {
  id: string;
  ownerId: string;
  processingId: string;
  originalContent: string;
  elements: unknown;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaTextRepository implements TextRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(text: Text): Promise<void> {
    await this.prisma.text.create({
      data: {
        id: text.id,
        ownerId: text.ownerId,
        processingId: text.processingId,
        originalContent: text.originalContent,
        elements: text.elements as object,
        version: 1,
        createdAt: text.createdAt,
        updatedAt: text.updatedAt,
      },
    });
  }

  async findOwned(ownerId: string): Promise<Text[]> {
    const records = await this.prisma.text.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      select: textSelect,
    });

    return records.map((record) => this.toDomain(record));
  }

  async findOwnedById(ownerId: string, textId: string): Promise<Text | null> {
    const record = await this.prisma.text.findFirst({
      where: { id: textId, ownerId },
      select: textSelect,
    });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: PersistedText): Text {
    return Text.restore(record);
  }
}
