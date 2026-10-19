import { ReaderController } from './reader.controller.js';
import { TextNotFoundError } from '../../application/errors/text-not-found.error.js';

describe('ReaderController', () => {
  it('passes the owner and text id to the service', async () => {
    const listOwnedTexts = {
      execute: vi.fn().mockResolvedValue([]),
    };
    const getOwnedText = {
      execute: vi.fn().mockResolvedValue({ textId: 'text-id' }),
    };
    const controller = new ReaderController(
      listOwnedTexts as never,
      getOwnedText as never,
    );

    await controller.listTexts('owner-id');
    await controller.getText('text-id', 'owner-id');

    expect(listOwnedTexts.execute).toHaveBeenCalledWith('owner-id');
    expect(getOwnedText.execute).toHaveBeenCalledWith(
      'owner-id',
      'text-id',
    );
  });


  it('translates a missing text into a not found HTTP error', async () => {
    const listOwnedTexts = { execute: vi.fn() };
    const getOwnedText = {
      execute: vi.fn().mockRejectedValue(new TextNotFoundError()),
    };
    const controller = new ReaderController(
      listOwnedTexts as never,
      getOwnedText as never,
    );

    await expect(controller.getText('text-id', 'owner-id')).rejects.toMatchObject(
      {
        status: 404,
        message: 'Text not found',
      },
    );
  });
});
