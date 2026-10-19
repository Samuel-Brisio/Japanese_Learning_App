import { Text } from './text.entity.js';
import type { StructuredText } from './text.entity.js';

describe('Text', () => {
  const structuredText: StructuredText = {
    language: 'ja',
    title: {
      content: 'A school day',
      elements: [
        {
          type: 'text',
          content: '学校の日',
        },
      ],
    },
    sentences: [
      {
        content: '私は学校へ行きました。',
        elements: [
          {
            type: 'word',
            content: '学校',
            reading: 'がっこう',
            canonicalWordId: 'canonical-school',
            wordId: 'school',
          },
        ],
      },
    ],
  };

  const validProps = {
    id: 'text-id',
    ownerId: 'owner-id',
    processingId: 'processing-id',
    text: structuredText,
    version: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  it('creates a structured text with version one and the supplied timestamp', () => {
    const text = Text.create({
      id: 'text-id',
      ownerId: 'owner-id',
      processingId: 'processing-id',
      text: structuredText,
      now: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(text.id).toBe('text-id');
    expect(text.ownerId).toBe('owner-id');
    expect(text.processingId).toBe('processing-id');
    expect(text.text).toEqual(structuredText);
    expect(text.version).toBe(1);
    expect(text.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(text.updatedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('restores a structured text from persistence', () => {
    const text = Text.restore(validProps);

    expect(text.id).toBe(validProps.id);
    expect(text.text).toEqual(validProps.text);
    expect(text.version).toBe(validProps.version);
    expect(text.createdAt).toEqual(validProps.createdAt);
    expect(text.updatedAt).toEqual(validProps.updatedAt);
  });

  it.each([
    [
      'missing language',
      { ...structuredText, language: '' },
      'Text language is required',
    ],
    [
      'missing title',
      { ...structuredText, title: undefined },
      'Text title is required',
    ],
    [
      'missing title content',
      {
        ...structuredText,
        title: { ...structuredText.title, content: '  ' },
      },
      'Text section content cannot be empty',
    ],
    [
      'missing title elements',
      {
        ...structuredText,
        title: { ...structuredText.title, elements: [] },
      },
      'Text section elements are required',
    ],
    [
      'missing sentences',
      { ...structuredText, sentences: [] },
      'Text sentences are required',
    ],
  ])('rejects %s', (_caseName, invalidText, message) => {
    expect(() =>
      Text.create({
        id: 'text-id',
        ownerId: 'owner-id',
        processingId: 'processing-id',
        text: invalidText as StructuredText,
      }),
    ).toThrow(message);
  });

  it.each([
    [
      'an empty type',
      { type: '', content: '学校' },
      'Text element type cannot be empty',
    ],
    [
      'empty content',
      { type: 'text', content: '  ' },
      'Text element content cannot be empty',
    ],
    [
      'a word without canonicalWordId',
      { type: 'word', content: '学校', wordId: 'school', reading: 'がっこう' },
      'Text element canonicalWordId is required for type "word"',
    ],
    [
      'a word without wordId',
      {
        type: 'word',
        content: '学校',
        canonicalWordId: 'canonical-school',
        reading: 'がっこう',
      },
      'Text element wordId is required for type "word"',
    ],
    [
      'a word without reading',
      {
        type: 'word',
        content: '学校',
        canonicalWordId: 'canonical-school',
        wordId: 'school',
      },
      'Text element reading is required for type "word"',
    ],
  ])('rejects %s', (_caseName, invalidElement, message) => {
    expect(() =>
      Text.create({
        id: 'text-id',
        ownerId: 'owner-id',
        processingId: 'processing-id',
        text: {
          ...structuredText,
          title: {
            ...structuredText.title,
            elements: [invalidElement],
          },
        } as StructuredText,
      }),
    ).toThrow(message);
  });

  it('rejects persisted texts with an invalid version', () => {
    expect(() => Text.restore({ ...validProps, version: 0 })).toThrow(
      'Text version must be at least 1',
    );
  });
});
