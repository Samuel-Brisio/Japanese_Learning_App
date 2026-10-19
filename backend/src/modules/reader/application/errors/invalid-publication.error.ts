export class InvalidPublicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPublicationError';
  }
}

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}