import { ILead, Lead } from '../../shared/models/lead.model';
import { BaseService } from '../../shared/services/BaseService';
import { BadRequestError, CustomError, InternalServerError, NotFoundError } from '../../shared/utils/CustomError';

import { ILeadCreate, ILeadFilter, ILeadUpdate } from './lead.interface';

export class LeadService extends BaseService<ILead> {
  constructor() {
    super(Lead, 'Lead');
  }

  async createLead(data: ILeadCreate): Promise<ILead> {
    try {
      if (!data.agencyId) {
        throw new BadRequestError('Agency ID is required');
      }
      return await this.create(data);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Lead creation failed: ${error.message}`);
    }
  }

  async getAll(query: ILeadFilter): Promise<{ data: ILead[]; total: number }> {
    try {
      if (!query.agencyId) {
        throw new BadRequestError('Agency ID is required');
      }
      const { limit, page, ...filterQuery } = query;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.model
          .find(filterQuery)
          .select('fullName email status phone alternatePhone createdAt updatedAt source aiScore.value')
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(filterQuery).exec(),
      ]);

      return { data: data as ILead[], total };
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
      if (!query.agencyId) {
        throw new BadRequestError('Agency ID is required');
      }
      const lead = await this.model
        .findOne({ _id: id, agencyId: query.agencyId })
        .lean({ virtuals: true }) // ← The magic performance booster!
        .exec();

      if (!lead) {
        throw new NotFoundError(`Lead not found with ID: ${id}`);
      }

      return lead as ILead;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Lead fetching failed: ${error.message}`);
    }
  }

  async update(id: string, data: ILeadUpdate, agencyId?: string): Promise<ILead> {
    try {
      const query: { _id: string; agencyId?: string } = { _id: id };
      if (agencyId) {
        query.agencyId = agencyId;
      }

      const updatedLead = await this.model
        .findOneAndUpdate(query, data, { new: true })
        .select('fullName email status phone alternatePhone createdAt updatedAt source aiScore.value')
        .lean({ virtuals: true })
        .exec();

      if (!updatedLead) {
        throw new NotFoundError(`Lead not found with ID: ${id}`);
      }

      return updatedLead as ILead;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(
        `Lead updating failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async delete(id: string, agencyId: string): Promise<ILead> {
    try {
      if (!agencyId) {
        throw new BadRequestError('Agency ID is required');
      }
      if (!id) {
        throw new BadRequestError('Lead ID is required');
      }
      const updatedLead = await this.model
        .findOneAndUpdate(
          { _id: id, agencyId },
          {
            $set: {
              'audit.isDeleted': true,
              'audit.deletedAt': new Date(),
              'audit.version': { $inc: 1 },
              'audit.deletedBy': agencyId,
            },
          },
          { new: true },
        )
        .lean({ virtuals: true })
        .exec();

      if (!updatedLead) {
        throw new NotFoundError(`Lead not found with ID: ${id}`);
      }

      return updatedLead as ILead;
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(
        `Lead deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

export const leadService = new LeadService();
