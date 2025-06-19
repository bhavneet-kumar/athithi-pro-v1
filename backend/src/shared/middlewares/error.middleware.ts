// src/shared/middleware/error.middleware.ts

import http from 'node:http';

import { Request, Response, NextFunction } from 'express';
import { MongooseError } from 'mongoose';

import { DUPLICATE_KEY_ERROR_CODE } from '../constant/validation';
import { CustomError } from '../utils/CustomError';

const HTTP_STATUS = {
  INTERNAL_SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  SERVICE_UNAVAILABLE: 503,
  UNAUTHORIZED: 401,
} as const;

interface ErrorWithName {
  name?: string;
  message?: string;
  errors?: Record<string, { message: string }>;
  path?: string;
  value?: unknown;
  code?: number;
  keyValue?: Record<string, unknown>;
  stack?: string;
}

const isObject = (val: unknown): val is Record<string, unknown> => val !== null && typeof val === 'object';

const getErrorProps = (error: unknown): ErrorWithName => {
  if (isObject(error)) {
    const { name, message, errors, path, value, code, keyValue, stack } = error as ErrorWithName;
    return { name, message, errors, path, value, code, keyValue, stack };
  }
  return {};
};

const handleCustomError = (err: CustomError) => ({
  statusCode: err.httpCode,
  message: err.message,
  name: err.name,
});

const handleObjectError = (err: ErrorWithName) => {
  if (err.name === 'ValidationError' && err.errors) {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(', '),
      name: 'ValidationError',
    };
  }

  if (err.name === 'CastError') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `Invalid value for '${err.path}': ${err.value}`,
      name: 'CastError',
    };
  }

  if (err.code === DUPLICATE_KEY_ERROR_CODE && err.keyValue) {
    const field = Object.keys(err.keyValue).join(', ');
    return {
      statusCode: HTTP_STATUS.CONFLICT,
      message: `Duplicate value for: ${field}`,
      name: 'MongoConflictError',
    };
  }

  if (typeof err.message === 'string' && err.message.toLowerCase().includes('redis')) {
    return {
      statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
      message: 'Redis service is unavailable',
      name: 'RedisError',
    };
  }

  if (err.name === 'JsonWebTokenError') {
    return { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid token', name: 'JsonWebTokenError' };
  }

  if (err.name === 'TokenExpiredError') {
    return { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Token expired', name: 'TokenExpiredError' };
  }

  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: err.message ?? 'Something went wrong',
    name: err.name ?? 'Error',
  };
};

const sendErrorResponse = (
  req: Request,
  res: Response,
  { statusCode, message, name, stack }: { statusCode: number; message: string; name?: string; stack?: string },
) => {
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    status: (http.STATUS_CODES[statusCode] || 'Error').toUpperCase(),
    message,
    data: null,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
  });
};

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof CustomError) {
    const payload = handleCustomError(err);
    return sendErrorResponse(req, res, { ...payload, stack: err.stack });
  }

  if (err instanceof MongooseError) {
    return sendErrorResponse(req, res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
  }

  if (isObject(err)) {
    const props = getErrorProps(err);
    const payload = handleObjectError(props);
    return sendErrorResponse(req, res, { ...payload, stack: props.stack });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return sendErrorResponse(req, res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid JSON payload',
      name: 'SyntaxError',
    });
  }

  if (err instanceof TypeError || err instanceof ReferenceError || err instanceof RangeError) {
    return sendErrorResponse(req, res, {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
  }

  console.error('❌ Unhandled Error:', err);
  return sendErrorResponse(req, res, {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'Something went wrong',
    name: 'UnknownError',
  });
};
