// src/shared/utils/CustomError.ts

export class CustomError extends Error {
  public httpCode: number;
  public isOperational: boolean;

  static BAD_REQUEST = 400;
  static UNAUTHORIZED = 401;
  static FORBIDDEN = 403;
  static NOT_FOUND = 404;
  static CONFLICT = 409;
  static INTERNAL_SERVER_ERROR = 500;

  constructor(name: string, httpCode: number, description: string) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.httpCode = httpCode;
    this.isOperational = true;
    Error.captureStackTrace(this);
  }
}

export class BadRequestError extends CustomError {
  constructor(description = 'Bad Request') {
    super('BadRequestError', CustomError.BAD_REQUEST, description);
  }
}

export class BusinessError extends CustomError {
  constructor(description = 'Business Logic Error') {
    super('BusinessError', CustomError.BAD_REQUEST, description);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(description = 'Unauthorized') {
    super('UnauthorizedError', CustomError.UNAUTHORIZED, description);
  }
}

export class ForbiddenError extends CustomError {
  constructor(description = 'Forbidden') {
    super('ForbiddenError', CustomError.FORBIDDEN, description);
  }
}

export class NotFoundError extends CustomError {
  constructor(description = 'Not Found') {
    super('NotFoundError', CustomError.NOT_FOUND, description);
  }
}

export class ConflictError extends CustomError {
  constructor(description = 'Conflict') {
    super('ConflictError', CustomError.CONFLICT, description);
  }
}

export class InternalServerError extends CustomError {
  constructor(description = 'Internal Server Error') {
    super('InternalServerError', CustomError.INTERNAL_SERVER_ERROR, description);
  }
}
