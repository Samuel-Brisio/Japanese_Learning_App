import { InvalidPublicationError } from '../errors/invalid-publication.error.js';
import { ReceiveStructuredTextUseCase } from './receive-structured-text.use-case.js';
import type { StructuredText } from '../../domain/models/text.entity.js';

describe('ReceiveStructuredTextUseCase', () => {
  const structuredText: StructuredText = {
    language: 'ja',
    title: {
      content: 'Title',
      elements: [{ type: 'text', content: 'タイトル' }],
    },
    sentences: [
      {
        content: 'Sentence',
        elements: [{ type: 'text', content: '文' }],
      },
    ],
  };

  it('saves and returns a valid publication', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const useCase = new ReceiveStructuredTextUseCase({ save } as never);

    const result = await useCase.execute({
      ownerId: 'owner-id',
      processingId: 'processing-id',
      structuredText,
    });

    expect(save).toHaveBeenCalledOnce();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'owner-id',
        processingId: 'processing-id',
        text: structuredText,
        version: 1,
      }),
    );
    expect(result).toMatchObject({
      text: structuredText,
      version: 1,
    });
  });

  it('wraps structured-text validation failures as InvalidPublicationError', async () => {
    const save = vi.fn();
    const useCase = new ReceiveStructuredTextUseCase({ save } as never);

    await expect(
      useCase.execute({
        ownerId: 'owner-id',
        processingId: 'processing-id',
        structuredText: {
          ...structuredText,
          language: '',
        },
      }),
    ).rejects.toEqual(new InvalidPublicationError('Text language is required'));
    expect(save).not.toHaveBeenCalled();
  });

  it('does not hide repository failures', async () => {
    const repositoryError = new Error('database unavailable');
    const save = vi.fn().mockRejectedValue(repositoryError);
    const useCase = new ReceiveStructuredTextUseCase({ save } as never);

    await expect(
      useCase.execute({
        ownerId: 'owner-id',
        processingId: 'processing-id',
        structuredText,
      }),
    ).rejects.toBe(repositoryError);
  });
});
