import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

import { NotFoundError, BadRequestError, InternalServerError, BusinessError } from '../utils/CustomError';

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
    } catch (error: any) {
      this.handleDatabaseError(error, 'create');
    }
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
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      this.handleDatabaseError(error, 'findById');
    }
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
    } catch (error: any) {
      this.handleDatabaseError(error, 'find');
    }
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
    } catch (error: any) {
      this.handleDatabaseError(error, 'findOne');
    }
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
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      this.handleDatabaseError(error, 'updateById');
    }
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
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      this.handleDatabaseError(error, 'deleteById');
    }
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
    } catch (error: any) {
      this.handleDatabaseError(error, 'exists');
    }
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
    limit = 10,
    sort: any = { createdAt: -1 },
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
        limit = 10;
      }
      if (limit > 100) {
        limit = 100;
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
    } catch (error: any) {
      this.handleDatabaseError(error, 'paginate');
    }
  }

  /**
   * Handle database errors and convert to appropriate CustomError
   * @param error - The caught error
   * @param operation - The operation that failed
   */
  protected handleDatabaseError(error: any, operation: string): never {
    console.error(`Database error in ${this.modelName}.${operation}:`, error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      throw new BadRequestError(`Validation failed: ${messages.join(', ')}`);
    }

    // Mongoose cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      throw new BadRequestError(`Invalid ${error.path}: ${error.value}`);
    }

    // Duplicate key error
    if (error.code === 11_000) {
      const field = Object.keys(error.keyValue || {}).join(', ');
      throw new BusinessError(`Duplicate value for field: ${field}`);
    }

    // If it's already a CustomError, re-throw it
    if (error.isOperational) {
      throw error;
    }

    // Default to internal server error
    throw new InternalServerError(`Database operation failed: ${operation}`);
  }

  /**
   * Validate input data against schema
   * @param data - Data to validate
   * @param schema - Zod schema
   * @returns Validated data
   */
  protected validateInput<K>(data: any, schema: any): K {
    try {
      return schema.parse(data);
    } catch (error: any) {
      if (error.errors) {
        const messages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        throw new BadRequestError(`Validation failed: ${messages.join(', ')}`);
      }
      throw new BadRequestError('Invalid input data');
    }
  }
}
