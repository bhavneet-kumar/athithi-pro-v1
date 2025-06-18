import { Agency } from '../../shared/models/agency.model';
import { BaseService } from '../../shared/services/baseService';
import {
  BadRequestError,
  NotFoundError,
  BusinessError,
  InternalServerError,
  CustomError,
} from '../../shared/utils/customError';

import { AgencyFilters, AgencySortOptions, IAgency } from './agency.interface';
import { CreateAgencyInput, UpdateAgencyInput } from './agency.validator';
import { agencyRoleService } from './agencyRole.service';

/**
 * Agency Service Class
 * Extends BaseService to inherit common CRUD operations
 * Implements business logic specific to agency management
 */
export class AgencyService extends BaseService<IAgency> {
  private static readonly UNKNOWN_ERROR_MESSAGE = 'Unknown error occurred';

  constructor() {
    super(Agency, 'Agency');
  }

  /**
   * Create a new agency with default roles
   * @param data - Agency creation data
   * @returns Created agency
   */
  async createAgency(data: CreateAgencyInput): Promise<IAgency> {
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
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Agency creation failed: ${errorMessage}`);
    }
  }

  /**
   * Get agency by ID with error handling
   * @param id - Agency ID
   * @returns Agency document
   */
  async getAgencyById(id: string): Promise<IAgency> {
    try {
      if (!id) {
        throw new BadRequestError('Agency ID is required');
      }

      const agency = await this.findById(id);
      if (!agency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }
      return agency;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Failed to retrieve agency: ${errorMessage}`);
    }
  }

  /**
   * Update agency with validation
   * @param id - Agency ID
   * @param data - Update data
   * @returns Updated agency
   */
  async updateAgency(id: string, data: UpdateAgencyInput): Promise<IAgency> {
    try {
      if (!id) {
        throw new BadRequestError('Agency ID is required');
      }

      const existingAgency = await this.getExistingAgency(id);
      await this.validateCodeUniqueness(id, data, existingAgency);
      await this.validateDomainUniqueness(id, data, existingAgency);

      const updatedAgency = await this.updateById(id, data);
      if (!updatedAgency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }
      return updatedAgency;
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Agency update failed: ${errorMessage}`);
    }
  }

  private async getExistingAgency(id: string): Promise<IAgency> {
    const existingAgency = await this.findById(id);
    if (!existingAgency) {
      throw new NotFoundError(`Agency not found with ID: ${id}`);
    }
    return existingAgency;
  }

  private async validateCodeUniqueness(id: string, data: UpdateAgencyInput, existingAgency: IAgency): Promise<void> {
    if (data.code && data.code !== existingAgency.code) {
      const codeExists = await this.findOne({
        code: data.code,
        _id: { $ne: id },
      });
      if (codeExists) {
        throw new BusinessError(`Agency with code '${data.code}' already exists`);
      }
    }
  }

  private async validateDomainUniqueness(id: string, data: UpdateAgencyInput, existingAgency: IAgency): Promise<void> {
    if (data.domain && data.domain !== existingAgency.domain) {
      const domainExists = await this.findOne({
        domain: data.domain,
        _id: { $ne: id },
      });
      if (domainExists) {
        throw new BusinessError(`Agency with domain '${data.domain}' already exists`);
      }
    }
  }

  /**
   * Delete agency with cascade operations
   * @param id - Agency ID
   */
  async deleteAgency(id: string): Promise<void> {
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
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Agency deletion failed: ${errorMessage}`);
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
    filters: AgencyFilters,
    page: number,
    limit: number,
    sort: AgencySortOptions,
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
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Failed to list agencies: ${errorMessage}`);
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
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Failed to find agency by code: ${errorMessage}`);
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
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Failed to find agency by domain: ${errorMessage}`);
    }
  }

  /**
   * Update agency settings
   * @param id - Agency ID
   * @param settings - Settings object
   * @returns Updated agency
   */
  async updateAgencySettings(id: string, settings: Record<string, unknown>): Promise<IAgency> {
    try {
      if (!id) {
        throw new BadRequestError('Agency ID is required');
      }

      const updatedAgency = await this.updateById(id, { settings });
      if (!updatedAgency) {
        throw new NotFoundError(`Agency not found with ID: ${id}`);
      }
      return updatedAgency;
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : AgencyService.UNKNOWN_ERROR_MESSAGE;
      throw new InternalServerError(`Agency settings update failed: ${errorMessage}`);
    }
  }
}

export const agencyService = new AgencyService();
