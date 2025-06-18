import { ILead, Lead } from '../../shared/models/lead.model';
import { BaseService } from '../../shared/services/BaseService';
import { CustomError, InternalServerError, NotFoundError } from '../../shared/utils/CustomError';

import { ILeadCreate, ILeadFilter } from './lead.interface';

export class LeadService extends BaseService<ILead> {
  constructor() {
    super(Lead, 'Lead');
  }

  async createLead(data: ILeadCreate): Promise<ILead> {
    try {
      return await this.create(data);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Lead creation failed: ${error.message}`);
    }
  }

  async getAll(query: ILeadFilter): Promise<ILead[]> {
    try {
      const { limit, page, ...filterQuery } = query;
      const skip = (page - 1) * limit;

      return await this.model
        .find(filterQuery)
        .skip(skip)
        .limit(limit)
        .lean() // ← Boosts performance by returning plain JS objects
        .exec() // ← Always use exec() for better stack traces
        .then((docs) => docs as ILead[]); // ← Type assertion for lean results
    } catch (error) {
      if (error instanceof CustomError) {
        throw error; // Preserve known error types
      }
      throw new InternalServerError(
        `Failed to fetch leads: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getById(id: string, query: ILeadFilter): Promise<ILead> {
    try {
      const lead = await this.model
        .findOne({ _id: id, agencyId: query.agencyId })
        .lean({ virtuals: true }) // ← The magic performance booster!
        .exec();

      if (!lead) {
        throw new NotFoundError(`Lead not found with ID: ${id}`);
      }

      return lead as ILead; // Type assertion for lean result
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Lead fetching failed: ${error.message}`);
    }
  }
}

export const leadService = new LeadService();
