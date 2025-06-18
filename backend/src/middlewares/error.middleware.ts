import { AxiosError } from 'axios';
import { Request, Response } from 'express';

import { CustomError } from '../shared/utils/CustomError';

export const errorHandler = (err: unknown, req: Request, res: Response) => {
  let statusCode = 500;
  let message = 'Something went wrong';

  const isObject = (val: unknown): val is Record<string, unknown> => val !== null && typeof val === 'object';

  if (err instanceof CustomError) {
    statusCode = err.httpCode;
    message = err.message;
  } else if (isObject(err) && err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e: { message: string }) => e.message)
      .join(', ');
  } else if (isObject(err) && err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for '${err.path}': ${err.value}`;
  } else if (isObject(err) && err.code === 11_000 && err.keyValue) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate field value entered: ${field}`;
  } else if (isObject(err) && typeof err.message === 'string' && err.message.toLowerCase().includes('redis')) {
    statusCode = 503;
    message = 'Redis service is unavailable';
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  } else if (isObject(err) && err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (isObject(err) && err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  } else if ((err as AxiosError).isAxiosError) {
    const axiosErr = err as AxiosError;
    statusCode = axiosErr.response?.status || 500;
    message =
      typeof axiosErr.response?.data === 'string'
        ? axiosErr.response.data
        : (axiosErr.response?.data as Record<string, unknown>)?.message?.toString() || 'Axios request failed';
  } else if (err instanceof TypeError || err instanceof ReferenceError || err instanceof RangeError) {
    statusCode = 500;
    message = err.message;
  } else {
    console.error('❌ Unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: {
      name: isObject(err) && err.name ? err.name : 'Error',
      message,
    },
    ...(process.env.NODE_ENV === 'development' && isObject(err) && err.stack ? { stack: err.stack } : {}),
  });
};
