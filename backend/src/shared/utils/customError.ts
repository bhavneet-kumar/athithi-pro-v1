export class CustomError extends Error {
  public httpCode: number;
  public isOperational: boolean;

  static BAD_REQUEST = 400;
  static UNAUTHORIZED = 401;
  static FORBIDDEN = 403;
  static NOT_FOUND = 404;
  static CONFLICT = 409;
  static INTERNAL_SERVER_ERROR = 500;

  constructor(httpCode: number, description: string) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'CustomError';
    this.httpCode = httpCode;
    this.isOperational = true;
    Error.captureStackTrace(this);
  }
}

export class BadRequestError extends CustomError {
  constructor(description = 'Bad Request') {
    super(CustomError.BAD_REQUEST, description);
    this.name = 'BadRequestError';
  }
}

export class BusinessError extends CustomError {
  constructor(description = 'Business Logic Error') {
    super(CustomError.BAD_REQUEST, description);
    this.name = 'BusinessError';
  }
}

export class UnauthorizedError extends CustomError {
  constructor(description = 'Unauthorized') {
    super(CustomError.UNAUTHORIZED, description);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends CustomError {
  constructor(description = 'Forbidden') {
    super(CustomError.FORBIDDEN, description);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends CustomError {
  constructor(description = 'Not Found') {
    super(CustomError.NOT_FOUND, description);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CustomError {
  constructor(description = 'Conflict') {
    super(CustomError.CONFLICT, description);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends CustomError {
  constructor(description = 'Internal Server Error') {
    super(CustomError.INTERNAL_SERVER_ERROR, description);
    this.name = 'InternalServerError';
  }
}
