import { Request, Response, NextFunction } from 'express';
import { MongooseError } from 'mongoose';

import { DUPLICATE_KEY_ERROR_CODE } from '../constant/validation';
import { CustomError } from '../utils/customError';

// HTTP status codes used in errors
const HTTP_STATUS = {
  INTERNAL: 500,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  UNAVAILABLE: 503,
  UNAUTHORIZED: 401,
} as const;

type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

interface ErrorWithName {
  name?: string;
  message?: string;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: unknown;
  code?: number;
  stack?: string;
}

const isObject = (val: unknown): val is Record<string, unknown> => val !== null && typeof val === 'object';

const getErrorProps = (error: unknown): ErrorWithName => {
  if (isObject(error)) {
    const { name, message, errors, path, value, code, stack } = error as ErrorWithName;
    return { name, message, errors, path, value, code, stack };
  }
  return {};
};

// Simplified send response with correct literal type
const sendErrorResponse = (
  req: Request,
  res: Response,
  opts: { statusCode: number; message: string; stack?: string },
): void => {
  const { statusCode, message, stack } = opts;
  const validValues = Object.values(HTTP_STATUS) as HttpStatusCode[];
  const code: HttpStatusCode = validValues.includes(statusCode as HttpStatusCode)
    ? (statusCode as HttpStatusCode)
    : HTTP_STATUS.INTERNAL;

  let statusText: string;
  switch (code) {
    case HTTP_STATUS.BAD_REQUEST: {
      statusText = 'BAD_REQUEST';
      break;
    }
    case HTTP_STATUS.CONFLICT: {
      statusText = 'CONFLICT';
      break;
    }
    case HTTP_STATUS.UNAVAILABLE: {
      statusText = 'SERVICE_UNAVAILABLE';
      break;
    }
    case HTTP_STATUS.UNAUTHORIZED: {
      statusText = 'UNAUTHORIZED';
      break;
    }
    default: {
      statusText = 'INTERNAL_SERVER_ERROR';
    }
  }

  res.status(code).json({
    success: false,
    code,
    status: statusText,
    message,
    data: null,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
  });
};

// Handlers for different error types with explicit return types
const handleCustomError = (err: CustomError): { statusCode: number; message: string; stack?: string } => ({
  statusCode: err.httpCode,
  message: err.message,
  stack: err.stack,
});

const handleMongooseError = (err: MongooseError): { statusCode: number; message: string; stack?: string } => ({
  statusCode: HTTP_STATUS.BAD_REQUEST,
  message: err.message,
  stack: err.stack,
});

const handleObjectError = (err: ErrorWithName): { statusCode: number; message: string; stack?: string } => {
  if (err.name === 'ValidationError' && err.errors) {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(', '),
      stack: err.stack,
    };
  }
  if (err.name === 'CastError') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `Invalid value for '${err.path}': ${err.value}`,
      stack: err.stack,
    };
  }
  if (err.code === DUPLICATE_KEY_ERROR_CODE) {
    return {
      statusCode: HTTP_STATUS.CONFLICT,
      message: 'Duplicate key error',
      stack: err.stack,
    };
  }
  if (err.name === 'JsonWebTokenError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid token',
      stack: err.stack,
    };
  }
  if (err.name === 'TokenExpiredError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Token expired',
      stack: err.stack,
    };
  }
  // Default
  return {
    statusCode: HTTP_STATUS.INTERNAL,
    message: err.message ?? 'Something went wrong',
    stack: err.stack,
  };
};

// Known error handlers
const handleKnownErrors = (err: unknown, req: Request, res: Response): boolean => {
  if (err instanceof CustomError) {
    sendErrorResponse(req, res, handleCustomError(err));
    return true;
  }
  if (err instanceof MongooseError) {
    sendErrorResponse(req, res, handleMongooseError(err));
    return true;
  }
  if (isObject(err)) {
    const props = getErrorProps(err);
    sendErrorResponse(req, res, handleObjectError(props));
    return true;
  }
  return false;
};

// Syntax error handler
const handleSyntaxError = (err: unknown, req: Request, res: Response): boolean => {
  if (err instanceof SyntaxError && 'body' in err) {
    sendErrorResponse(req, res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid JSON payload',
    });
    return true;
  }
  return false;
};

// Built-in JS error handler
const handleBuiltinErrors = (err: unknown, req: Request, res: Response): boolean => {
  if (err instanceof TypeError || err instanceof ReferenceError || err instanceof RangeError) {
    sendErrorResponse(req, res, {
      statusCode: HTTP_STATUS.INTERNAL,
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    return true;
  }
  return false;
};

// Unknown error fallback
const handleUnknownError = (err: unknown, req: Request, res: Response): void => {
  console.error('❌ Unhandled Error:', err);
  sendErrorResponse(req, res, {
    statusCode: HTTP_STATUS.INTERNAL,
    message: 'Something went wrong',
  });
};

// Main middleware as function expression
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (handleKnownErrors(err, req, res) || handleSyntaxError(err, req, res) || handleBuiltinErrors(err, req, res)) {
    return;
  }

  handleUnknownError(err, req, res);
};
