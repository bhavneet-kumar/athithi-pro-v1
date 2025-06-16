import { Request, Response, NextFunction } from 'express';

import { MILLISECONDS_IN_SECOND, NANOSECONDS_IN_MILLISECOND } from '../constant/timeValues';
import logger from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime(); // High-resolution time

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const responseTimeMs = (seconds * MILLISECONDS_IN_SECOND + nanoseconds / NANOSECONDS_IN_MILLISECOND).toFixed(2); // In milliseconds

    const { statusCode } = res;
    const logMessage = `Method: ${req.method}, URL: ${req.originalUrl}, Status: ${statusCode}, ResponseTime: ${responseTimeMs}ms, Query: ${JSON.stringify(req.query)}, Params: ${JSON.stringify(req.params)}, Body: ${JSON.stringify(req.body)}`;

    logger.info(logMessage);
  });

  next();
};
