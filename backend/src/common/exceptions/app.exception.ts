export class AppException extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION',
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
