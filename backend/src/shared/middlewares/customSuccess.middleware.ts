import { Request, Response, NextFunction } from 'express';

import CustomSuccess from '../utils/customsuccessres';

export const successResponseMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.customSuccess = function (customSuccess: CustomSuccess): Response {
    const NO_CONTENT_STATUS = 204;
    if (customSuccess.httpCode === NO_CONTENT_STATUS) {
      return this.status(NO_CONTENT_STATUS).send();
    }

    return this.status(customSuccess.httpCode).json({
      success: true,
      name: customSuccess.name,
      statusCode: customSuccess.httpCode,
      message: customSuccess.message,
      data: customSuccess.data,
    });
  };

  next();
};
