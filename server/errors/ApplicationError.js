export class ApplicationError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
  }
}

