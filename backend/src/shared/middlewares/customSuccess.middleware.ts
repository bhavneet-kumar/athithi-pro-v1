import { Request, Response, NextFunction } from 'express';
import CustomSuccess from '../utils/CustomSuccess';

/**
 * Middleware to attach a standardized success response handler to the response object.
 * Ensures consistent and professional API responses across the application.
 */
export const successResponseMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  /**
   * Custom success response function.
   * @param {CustomSuccess} customSuccess - CustomSuccess instance containing response details.
   * @returns {Response} - Express response object with formatted JSON.
   */
  res.customSuccess = function (customSuccess: CustomSuccess): Response {
    const NO_CONTENT = 204;

    if (customSuccess.httpCode === NO_CONTENT) {
      return this.status(NO_CONTENT).send();
    }

    return this.status(customSuccess.httpCode).json({
      success: true,
      code: customSuccess.httpCode,
      status: customSuccess.name,
      message: customSuccess.message,
      data: customSuccess.data || null,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  };

  next();
};

// import { Request, Response, NextFunction } from 'express';

// import CustomSuccess from '../utils/CustomSuccess';

// export const successResponseMiddleware = (req: Request, res: Response, next: NextFunction): void => {
//   res.customSuccess = function (customSuccess: CustomSuccess): Response {
//     const NO_CONTENT_STATUS = 204;
//     if (customSuccess.httpCode === NO_CONTENT_STATUS) {
//       return this.status(NO_CONTENT_STATUS).send();
//     }

//     return this.status(customSuccess.httpCode).json({
//       success: true,
//       name: customSuccess.name,
//       statusCode: customSuccess.httpCode,
//       message: customSuccess.message,
//       data: customSuccess.data,
//     });
//   };

//   next();
// };
