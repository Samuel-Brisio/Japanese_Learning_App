export class TextNotFoundError extends Error {
  constructor() {
    super('Text not found');
    this.name = 'TextNotFoundError';
  }
}
