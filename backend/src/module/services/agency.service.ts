import {
  CustomError,
  NotFoundError,
  BusinessError,
  BadRequestError,
  InternalServerError,
} from '../../shared/utils/CustomError';

import { Agency } from '../models/agency.model';
import { agencyRoleService } from './roles.service';
import { IAgency } from '../models/interfaces/agency.interface';
import { BaseService } from '../../shared/services/BaseService';
import { CreateAgencyInput, UpdateAgencyInput } from '../validators/agency.validator';

/**
 * Agency Service Class
 * Extends BaseService to inherit common CRUD operations
 * Implements business logic specific to agency management
 */
export class AgencyService extends BaseService<IAgency> {
  constructor() {
    super(Agency, 'Agency');
  }

  /**
   * Create a new agency with default roles
   * @param data - Agency creation data
   * @returns Created agency
   */
  async create(data: CreateAgencyInput): Promise<IAgency> {
    try {
      // Validate unique agency code
      const existingAgency = await this.findOne({ code: data.code });
      if (existingAgency) {
        throw new BusinessError(`Agency with code '${data.code}' already exists`);
      }

      // Validate unique domain
      const existingDomain = await this.findOne({ domain: data.domain });
      if (existingDomain) {
        throw new BusinessError(`Agency with domain '${data.domain}' already exists`);
      }

      // Create the agency - use model directly to avoid interface conflicts
      const agency = new Agency(data);
      await agency.save();

      // Create default roles for the agency
      await agencyRoleService.createDefaultRoles(agency.id.toString());

      return agency;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Agency creation failed: ${error.message}`);
    }
  }

  /**
   * Get agency by ID with error handling
   * @param id - Agency ID
   * @returns Agency document
   */
  async getEntityById(id: string): Promise<IAgency> {
    try {
      if (!id) {
        throw new BadRequestError('Agency ID is required');
      }

      const agency = await this.findById(id);
      if (!agency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }
      return agency;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to retrieve agency: ${error.message}`);
    }
  }

  /**
   * Update agency with validation
   * @param id - Agency ID
   * @param data - Update data
   * @returns Updated agency
   */
  async updateEntity(id: string, data: UpdateAgencyInput): Promise<IAgency> {
    try {
      if (!id) {
        throw new BadRequestError('Agency ID is required');
      }

      // Check if agency exists
      const existingAgency = await this.findById(id);
      if (!existingAgency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }

      // If updating code, check for uniqueness
      if (data.code && data.code !== existingAgency.code) {
        const codeExists = await this.findOne({
          code: data.code,
          _id: { $ne: id },
        });
        if (codeExists) {
          throw new BusinessError(`Agency with code '${data.code}' already exists`);
        }
      }

      // If updating domain, check for uniqueness
      if (data.domain && data.domain !== existingAgency.domain) {
        const domainExists = await this.findOne({
          domain: data.domain,
          _id: { $ne: id },
        });
        if (domainExists) {
          throw new BusinessError(`Agency with domain '${data.domain}' already exists`);
        }
      }

      const updatedAgency = await this.updateById(id, data);
      if (!updatedAgency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }
      return updatedAgency;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Agency update failed: ${error.message}`);
    }
  }

  /**
   * Delete agency with cascade operations
   * @param id - Agency ID
   */
  async deleteEntityById(id: string): Promise<void> {
    try {
      if (!id) {
        throw new BadRequestError('Agency ID is required');
      }

      // Check if agency exists
      const agency = await this.findById(id);
      if (!agency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }

      // TODO: Add cascade delete logic here
      // - Delete all users associated with this agency
      // - Delete all roles associated with this agency
      // - Clean up any other related data

      const deletedAgency = await this.deleteById(id);
      if (!deletedAgency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Agency deletion failed: ${error.message}`);
    }
  }

  /**
   * List agencies with pagination and filtering
   * @param filters - Query filters
   * @param page - Page number
   * @param limit - Items per page
   * @param sort - Sort options
   * @returns Paginated agencies
   */
  async listAgencies(
    filters: any = {},
    page = 1,
    limit = 10,
    sort: any = { createdAt: -1 },
  ): Promise<{
    agencies: IAgency[];
    totalAgencies: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const result = await this.paginate(filters, page, limit, sort);

      return {
        agencies: result.documents,
        totalAgencies: result.totalDocuments,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to list agencies: ${error.message}`);
    }
  }

  /**
   * Get agency by code
   * @param code - Agency code
   * @returns Agency document or null
   */
  async getAgencyByCode(code: string): Promise<IAgency | null> {
    try {
      if (!code) {
        throw new BadRequestError('Agency code is required');
      }

      return await this.findOne({ code: code.toUpperCase() });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to find agency by code: ${error.message}`);
    }
  }

  /**
   * Get agency by domain
   * @param domain - Agency domain
   * @returns Agency document or null
   */
  async getAgencyByDomain(domain: string): Promise<IAgency | null> {
    try {
      if (!domain) {
        throw new BadRequestError('Agency domain is required');
      }

      return await this.findOne({ domain });
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to find agency by domain: ${error.message}`);
    }
  }

  /**
   * Update agency settings
   * @param id - Agency ID
   * @param settings - Settings object
   * @returns Updated agency
   */
  async updateAgencySettings(id: string, settings: any): Promise<IAgency> {
    try {
      if (!id) {
        throw new BadRequestError('Agency ID is required');
      }

      const updatedAgency = await this.updateById(id, { settings });
      if (!updatedAgency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }
      return updatedAgency;
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Failed to update agency settings: ${error.message}`);
    }
  }
}

export const agencyService = new AgencyService();
