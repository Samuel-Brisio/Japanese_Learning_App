export class UserNotFoundError extends Error {
  constructor(ownerId: string) {
    super(`User with ID ${ownerId} does not exist.`);
    this.name = 'UserNotFoundError';
  }
}