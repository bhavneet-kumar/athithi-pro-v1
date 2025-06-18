import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

import { PAGINATION_DEFAULT_LIMIT, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../constant/validation';
import { BadRequestError } from '../utils/customError';

/**
 * Validation middleware factory
 * Validates request body, params, or query using Zod schemas
 */
export class ValidationMiddleware {
  /**
   * Validates request body
   * @param schema - Zod schema to validate against
   * @returns Express middleware function
   */
  static validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        req.body = schema.parse(req.body);

        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, 'body', next);
      }
    };
  }

  /**
   * Validates request params
   * @param schema - Zod schema to validate against
   * @returns Express middleware function
   */
  static validateParams(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        req.params = schema.parse(req.params);
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, 'params', next);
      }
    };
  }

  /**
   * Validates request query
   * @param schema - Zod schema to validate against
   * @returns Express middleware function
   */
  static validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        req.query = schema.parse(req.query);
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, 'query', next);
      }
    };
  }

  /**
   * Validates multiple parts of request
   * @param options - Validation options
   * @param options.body - Body schema
   * @param options.params - Params schema
   * @param options.query - Query schema
   * @returns Express middleware function
   */
  static validate(options: { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema }) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (options.body) {
          req.body = options.body.parse(req.body);
        }
        if (options.params) {
          req.params = options.params.parse(req.params);
        }
        if (options.query) {
          req.query = options.query.parse(req.query);
        }
        next();
      } catch (error) {
        ValidationMiddleware.handleValidationError(error, 'request', next);
      }
    };
  }

  /**
   * Handles Zod validation errors and converts them to CustomError
   * @param error - The validation error
   * @param source - Source of validation (body, params, query)
   * @param next - Express next function
   */
  private static handleValidationError(error: unknown, source: string, next: NextFunction): void {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root';
        return `${path}: ${err.message}`;
      });

      const message = `Validation failed for ${source}: ${errorMessages.join(', ')}`;
      next(new BadRequestError(message));
    } else {
      next(new BadRequestError(`Invalid ${source} data`));
    }
  }
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  /**
   * MongoDB ObjectId validation
   * @returns Promise resolving to Zod string schema for ObjectId validation
   */
  async objectId(): Promise<ZodSchema> {
    const { z } = await import('zod');
    return z
      .string()
      .regex(/^[\dA-Fa-f]{24}$/, 'Invalid ObjectId format')
      .describe('MongoDB ObjectId');
  },

  /**
   * Pagination query validation
   * @returns Promise resolving to Zod object schema for pagination parameters
   */
  async pagination(): Promise<ZodSchema> {
    const { z } = await import('zod');
    return z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : PAGINATION_DEFAULT_LIMIT)),
      sort: z.string().optional().default('createdAt'),
      order: z.enum(['asc', 'desc']).optional().default('desc'),
    });
  },

  /**
   * Email validation
   * @returns Promise resolving to Zod string schema for email validation
   */
  async email(): Promise<ZodSchema> {
    const { z } = await import('zod');
    return z.string().email('Invalid email format').toLowerCase().trim();
  },

  /**
   * Strong password validation
   * @returns Promise resolving to Zod string schema for password validation
   */
  async password(): Promise<ZodSchema> {
    const { z } = await import('zod');
    return z
      .string()
      .min(PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters')
      .max(PASSWORD_MAX_LENGTH, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[^\dA-Za-z]/, 'Password must contain at least one special character');
  },
};

// Export shorthand functions for common use cases
export const { validateBody } = ValidationMiddleware;
export const { validateParams } = ValidationMiddleware;
export const { validateQuery } = ValidationMiddleware;
export const { validate } = ValidationMiddleware;
