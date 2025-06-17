import { ILeadCreate, ILeadFilter } from './leads.interface';
import { ILead, Lead } from '../../shared/models/leads.model';
import { BaseService } from '../../shared/services/BaseService';
import { BadRequestError, CustomError, InternalServerError, NotFoundError } from '../../shared/utils/CustomError';

/**
 * Leads Service Class
 * Extends BaseService to inherit common CRUD operations
 * Implements business logic specific to agency management
 */
export class LeadsService extends BaseService<ILead> {
  constructor() {
    super(Lead, 'Lead');
  }

  /**
     * Create a new agency with default roles
     * @param data - Agency creation data
     * @returns Created agency
     */
    async createLeads(data: ILeadCreate): Promise<ILead> {
      try {  
        // Create the lead - use model directly to avoid interface conflicts
        const lead = new Lead(data);
        return await lead.save();

      } catch (error: any) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new InternalServerError(`Agency creation failed: ${error.message}`);
      }
    }

  /**
     * Get all leads
     * @returns Leads document
     */
    async getAllLeads(id: string): Promise<ILead[]> {
      try {
        return await this.find();
      } catch (error: any) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new InternalServerError(`Failed to retrieve leads: ${error.message}`);
      }
    }

  /**
     * Get lead by ID with error handling
     * @param id - Lead ID
     * @returns Leads document
     */
    async getLeadById(id: string): Promise<ILead> {
      try {
        if (!id) {
          throw new BadRequestError('Lead ID is required');
        }
  
        const lead = await this.findById(id);
        if (!lead) {
          throw new NotFoundError(`Agency not found with ID: ${id}`);
        }
        return lead;
      } catch (error: any) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new InternalServerError(`Failed to retrieve lead: ${error.message}`);
      }
    }

    /**
     * Get lead by ID with error handling
     * @param id - Lead ID
     * @param updatedData - Partial Lead Data Object
     */
    async findByIdAndUpdate(id: string, updatedData: Partial<ILead>): Promise<ILead> {
      try {
        if (!id) {
          throw new BadRequestError('Lead ID is required');
        }
  
        // Check if lead exists
        const existingLead = await this.findById(id);
        if (!existingLead) {
            throw new NotFoundError(`Lead not found with ID: ${id}`);
        }
        const updatedLead = await this.updateById(id, updatedData);
        if (!updatedLead) {
            throw new NotFoundError(`Lead not found with ID: ${id}`);
        }
        return updatedLead;
      } catch (error: any) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new InternalServerError(`Failed to retrieve lead: ${error.message}`);
      }
    }

    /**
     * Get lead by ID with error handling
     * @param id - Lead ID
     * @returns Leads document
     */
    async deleteLeadById(id: string): Promise<ILead> {
      try {
        if (!id) {
          throw new BadRequestError('Lead ID is required');
        }
  
        return await this.deleteById(id);
      } catch (error: any) {
        if (error instanceof CustomError) {
          throw error;
        }
        throw new InternalServerError(`Failed to retrieve lead: ${error.message}`);
      }
    }
}

export const leadsService = new LeadsService();