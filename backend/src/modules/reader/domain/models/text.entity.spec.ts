import { Text } from './text.entity.js';

describe('Text', () => {
  const validText = {
    id: 'text-id',
    ownerId: 'owner-id',
    processingId: 'processing-id',
    originalContent: '私は学校へ行きました。',
    elements: [{ type: 'sentence', text: '私は学校へ行きました。' }],
    version: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  it('restores a structured text from persistence', () => {
    const text = Text.restore(validText);

    expect({
      id: text.id,
      ownerId: text.ownerId,
      processingId: text.processingId,
      originalContent: text.originalContent,
      elements: text.elements,
      version: 1,
      createdAt: text.createdAt,
      updatedAt: text.updatedAt,
    }).toEqual(validText);
  });

  it('rejects invalid persisted text', () => {
    expect(() =>
      Text.restore({ ...validText, originalContent: '  ' }),
    ).toThrow('Text original content cannot be empty');
    expect(() => Text.restore({ ...validText, version: 0 })).toThrow(
      'Text version must be at least 1',
    );
  });
});
