import { Request, Response } from 'express';
import { MongooseError } from 'mongoose';

import { DUPLICATE_KEY_ERROR_CODE } from '../constant/validation';
import { CustomError } from '../utils/customerrors';

const HTTP_STATUS = {
  INTERNAL_SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  SERVICE_UNAVAILABLE: 503,
  UNAUTHORIZED: 401,
} as const;
//------NEED TO CORRECT THE FILE ------

type ErrorRecord = Record<string, { message: string }>;
interface ErrorWithName {
  name?: string;
  message?: string;
  errors?: ErrorRecord;
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

const handleCustomError = (err: CustomError): { statusCode: number; message: string } => {
  if (err instanceof MongooseError) {
    return { statusCode: HTTP_STATUS.BAD_REQUEST, message: err.message };
  }
  return { statusCode: err.httpCode, message: err.message };
};

const handleObjectError = (err: ErrorWithName): { statusCode: number; message: string } => {
  const { name, errors, path, value, code, keyValue, message: errMsg } = err;

  if (name === 'ValidationError' && errors) {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: Object.values(errors)
        .map((e) => e.message)
        .join(', '),
    };
  }
  if (name === 'CastError') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: `Invalid value for '${path}': ${value}`,
    };
  }
  if (code === DUPLICATE_KEY_ERROR_CODE && keyValue) {
    const field = Object.keys(keyValue).join(', ');
    return {
      statusCode: HTTP_STATUS.CONFLICT,
      message: `Duplicate field value entered: ${field}`,
    };
  }
  if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('redis')) {
    return { statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE, message: 'Redis service is unavailable' };
  }
  if (name === 'JsonWebTokenError') {
    return { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Invalid token' };
  }
  if (name === 'TokenExpiredError') {
    return { statusCode: HTTP_STATUS.UNAUTHORIZED, message: 'Token has expired' };
  }
  return { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Something went wrong' };
};

const sendErrorResponse = (
  res: Response,
  errorDetails: { statusCode: number; message: string; name?: string; stack?: string },
): void => {
  const { statusCode, message, name = 'Error', stack } = errorDetails;
  res.status(statusCode).json({
    success: false,
    statusCode,
    error: { name, message },
    ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
  });
};

export const errorHandler = (err: unknown, req: Request, res: Response): void => {
  if (err instanceof CustomError) {
    const { statusCode, message } = handleCustomError(err);
    sendErrorResponse(res, { statusCode, message, name: err.name });
    return;
  }

  if (isObject(err)) {
    const errorProps = getErrorProps(err);
    const { statusCode, message } = handleObjectError(errorProps);
    sendErrorResponse(res, { statusCode, message, name: errorProps.name || 'Error', stack: errorProps.stack });
    return;
  }

  if (err instanceof TypeError || err instanceof ReferenceError || err instanceof RangeError) {
    sendErrorResponse(res, { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: (err as Error).message });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    sendErrorResponse(res, { statusCode: HTTP_STATUS.BAD_REQUEST, message: 'Invalid JSON payload' });
    return;
  }

  console.error('❌ Unhandled error:', err);
  sendErrorResponse(res, { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: 'Something went wrong' });
};
