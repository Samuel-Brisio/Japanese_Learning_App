import { InvalidPublicationError } from '../../application/errors/invalid-publication.error.js';
import { PublicationController } from './publication.controller.js';

describe('PublicationController', () => {
  it('translates invalid structured text into a bad request', async () => {
    const receiveStructuredTextUseCase = {
      execute: vi
        .fn()
        .mockRejectedValue(
          new InvalidPublicationError('Text language is required'),
        ),
    };
    const controller = new PublicationController(
      receiveStructuredTextUseCase as never,
    );

    await expect(
      controller.handlePublication({
        ownerId: 'owner-id',
        processingId: 'processing-id',
        text: {} as never,
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Text language is required',
    });
  });
});
