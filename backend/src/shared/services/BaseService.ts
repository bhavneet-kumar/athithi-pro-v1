import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

import { NotFoundError, BadRequestError, InternalServerError, BusinessError } from '../utils/customError';

// Constants for magic numbers
const PAGINATION_DEFAULT_LIMIT = 10;
const PAGINATION_MAX_LIMIT = 100;
const DUPLICATE_KEY_ERROR_CODE = 11_000;

/**
 * Abstract Base Service Class implementing CRUD operations
 * Follows OOP principles: Abstraction, Encapsulation, Inheritance
 */
export abstract class BaseService<T extends Document> {
  protected model: Model<T>;
  protected modelName: string;

  constructor(model: Model<T>, modelName: string) {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Create a new document
   * @param data - Data to create the document
   * @returns Created document
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const document = new this.model(data);
      return await document.save();
    } catch (error) {
      this.handleDatabaseError(error as unknown, 'create');
    }
    // This line is unreachable, but TypeScript expects a return
    throw new InternalServerError('Failed to create document');
  }

  /**
   * Find document by ID
   * @param id - Document ID
   * @param populateFields - Fields to populate
   * @returns Found document or throws NotFoundError
   */
  async findById(id: string, populateFields?: string[]): Promise<T> {
    try {
      if (!id) {
        throw new BadRequestError('ID is required');
      }

      let query = this.model.findById(id);

      if (populateFields && populateFields.length > 0) {
        for (const field of populateFields) {
          query = query.populate(field);
        }
      }

      const document = await query.exec();

      if (!document) {
        throw new NotFoundError(`${this.modelName} not found with ID: ${id}`);
      }

      return document;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      this.handleDatabaseError(error as unknown, 'findById');
    }
    throw new InternalServerError('Failed to find document by ID');
  }

  /**
   * Find documents with filters
   * @param filter - Query filter
   * @param options - Query options
   * @returns Array of documents
   */
  async find(filter: FilterQuery<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    try {
      return await this.model.find(filter, null, options).exec();
    } catch (error) {
      this.handleDatabaseError(error as unknown, 'find');
    }
    throw new InternalServerError('Failed to find documents');
  }

  /**
   * Find one document
   * @param filter - Query filter
   * @param populateFields - Fields to populate
   * @returns Found document or null
   */
  async findOne(filter: FilterQuery<T>, populateFields?: string[]): Promise<T | null> {
    try {
      let query = this.model.findOne(filter);

      if (populateFields && populateFields.length > 0) {
        for (const field of populateFields) {
          query = query.populate(field);
        }
      }

      return await query.exec();
    } catch (error) {
      this.handleDatabaseError(error as unknown, 'findOne');
    }
    throw new InternalServerError('Failed to find one document');
  }

  /**
   * Update document by ID
   * @param id - Document ID
   * @param updateData - Data to update
   * @returns Updated document
   */
  async updateById(id: string, updateData: UpdateQuery<T>): Promise<T> {
    try {
      if (!id) {
        throw new BadRequestError('ID is required');
      }

      const document = await this.model.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();

      if (!document) {
        throw new NotFoundError(`${this.modelName} not found with ID: ${id}`);
      }

      return document;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      this.handleDatabaseError(error as unknown, 'updateById');
    }
    throw new InternalServerError('Failed to update document by ID');
  }

  /**
   * Delete document by ID
   * @param id - Document ID
   * @returns Deleted document
   */
  async deleteById(id: string): Promise<T> {
    try {
      if (!id) {
        throw new BadRequestError('ID is required');
      }

      const document = await this.model.findByIdAndDelete(id).exec();

      if (!document) {
        throw new NotFoundError(`${this.modelName} not found with ID: ${id}`);
      }

      return document;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      this.handleDatabaseError(error as unknown, 'deleteById');
    }
    throw new InternalServerError('Failed to delete document by ID');
  }

  /**
   * Check if document exists
   * @param filter - Query filter
   * @returns boolean
   */
  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const count = await this.model.countDocuments(filter).exec();
      return count > 0;
    } catch (error) {
      this.handleDatabaseError(error as unknown, 'exists');
    }
    throw new InternalServerError('Failed to check existence');
  }

  /**
   * Get documents with pagination
   * @param filter - Query filter
   * @param page - Page number (1-based)
   * @param limit - Documents per page
   * @param sort - Sort options
   * @returns Paginated result
   */
  async paginate(
    filter: FilterQuery<T> = {},
    page = 1,
    limit = PAGINATION_DEFAULT_LIMIT,
    sort?: { [key: string]: 1 | -1 },
  ): Promise<{
    documents: T[];
    totalDocuments: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      if (page < 1) {
        page = 1;
      }
      if (limit < 1) {
        limit = PAGINATION_DEFAULT_LIMIT;
      }
      if (limit > PAGINATION_MAX_LIMIT) {
        limit = PAGINATION_MAX_LIMIT;
      } // Prevent too large requests

      const skip = (page - 1) * limit;

      const [documents, totalDocuments] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
        this.model.countDocuments(filter).exec(),
      ]);

      const totalPages = Math.ceil(totalDocuments / limit);

      return {
        documents,
        totalDocuments,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      this.handleDatabaseError(error as unknown, 'paginate');
    }
    throw new InternalServerError('Failed to paginate documents');
  }

  protected handleDatabaseError(error: unknown, operation: string): never {
    // Try to narrow error type
    const err = error as {
      name?: string;
      errors?: Record<string, { message: string }>;
      path?: string;
      value?: string;
      code?: number;
      keyValue?: Record<string, unknown>;
      isOperational?: boolean;
      message?: string;
    };

    console.error(`Database error in ${this.modelName}.${operation}:`, error);

    // Mongoose validation error
    if (err.name === 'ValidationError' && err.errors) {
      const messages = Object.values(err.errors).map((e) => e.message);
      throw new BadRequestError(`Validation failed: ${messages.join(', ')}`);
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError' && err.path && err.value) {
      throw new BadRequestError(`Invalid ${err.path}: ${err.value}`);
    }

    // Duplicate key error
    if (err.code === DUPLICATE_KEY_ERROR_CODE) {
      const field = Object.keys(err.keyValue || {}).join(', ');
      throw new BusinessError(`Duplicate value for field: ${field}`);
    }

    // If it's already a CustomError, re-throw it
    if (err.isOperational) {
      throw error as Error;
    }

    // Default to internal server error
    throw new InternalServerError(`Database operation failed: ${operation}`);
  }

  protected validateInput<K>(data: unknown, schema: { parse: (input: unknown) => K }): K {
    try {
      return schema.parse(data);
    } catch (error) {
      // Try to narrow error type
      const err = error as { errors?: Array<{ path: string[]; message: string }> };
      if (err.errors) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new BadRequestError(`Validation failed: ${messages.join(', ')}`);
      }
      throw new BadRequestError('Invalid input data');
    }
  }
}
