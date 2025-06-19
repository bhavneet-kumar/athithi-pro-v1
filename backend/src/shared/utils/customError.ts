export class CustomError extends Error {
  public httpCode: number;
  public isOperational: boolean;

  static BAD_REQUEST = 400;
  static UNAUTHORIZED = 401;
  static FORBIDDEN = 403;
  static NOT_FOUND = 404;
  static INTERNAL_SERVER_ERROR = 500;

  constructor(name: string, httpCode: number, description: string) {
    super(description);

    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain

    this.name = 'CustomError';
    this.httpCode = httpCode;
    this.isOperational = true;

    Error.captureStackTrace(this);
  }
}

// ✅ 400 - Bad Request
export class BadRequestError extends CustomError {
  constructor(description: string = 'Bad Request') {
    super('BadRequestError', CustomError.BAD_REQUEST, description);
    this.name = 'BadRequestError';
  }
}

// ✅ 400 - Business Logic Error (custom 400 variant)
export class BusinessError extends CustomError {
  constructor(description: string = 'Business Error') {
    super('BusinessError', CustomError.BAD_REQUEST, description);
    this.name = 'BusinessError';
  }
}

// ✅ 401 - Unauthorized
export class UnauthorizedError extends CustomError {
  constructor(description: string = 'Unauthorized') {
    super('UnauthorizedError', CustomError.UNAUTHORIZED, description);
    this.name = 'UnauthorizedError';
  }
}

// ✅ 403 - Forbidden
export class ForbiddenError extends CustomError {
  constructor(description: string = 'Forbidden') {
    super('ForbiddenError', CustomError.FORBIDDEN, description);
    this.name = 'ForbiddenError';
  }
}

// ✅ 404 - Not Found
export class NotFoundError extends CustomError {
  constructor(description: string = 'Not Found') {
    super('NotFoundError', CustomError.NOT_FOUND, description);
    this.name = 'NotFoundError';
  }
}

// ✅ 500 - Internal Server Error
export class InternalServerError extends CustomError {
  constructor(description: string = 'Internal Server Error') {
    super('InternalServerError', CustomError.INTERNAL_SERVER_ERROR, description);
    this.name = 'InternalServerError';
  }
}