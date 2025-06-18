import { ILead, Lead } from '../../shared/models/lead.model';
import { BaseService } from '../../shared/services/BaseService';
import { aiScoreCalculator } from '../../shared/utils/aiScore';
import { BadRequestError, CustomError, InternalServerError, NotFoundError } from '../../shared/utils/CustomError';

import { ILeadCreate, ILeadFilter, ILeadUpdate } from './lead.interface';

export class LeadService extends BaseService<ILead> {
  constructor() {
    super(Lead, 'Lead');
  }

  async createLead(data: ILeadCreate): Promise<ILead> {
    try {
      console.log({
        audit: data.audit,
        body: data,
        emote: '🔍',
      });
      data.aiScore.value = Number(aiScoreCalculator.calculateScore(data as ILead));

      return await this.create(data);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new InternalServerError(`Lead creation failed: ${error.message}`);
    }
  }

  private getSortOptions(sortBy?: string, sortOrder?: 'asc' | 'desc'): { [key: string]: 1 | -1 } {
    if (!sortBy || !sortOrder) {
      return { createdAt: -1 }; // Default sort by creation date descending
    }

    const SORT_FIELDS = {
      fullName: 'fullName',
      email: 'email',
      status: 'status',
      phone: 'phone',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      source: 'source',
      aiScore: 'aiScore.value',
    } as const;

    type SortField = keyof typeof SORT_FIELDS;
    const sortField = SORT_FIELDS[sortBy as SortField] || 'createdAt';
    return { [sortField]: sortOrder === 'asc' ? 1 : -1 };
  }

  async getAll(query: ILeadFilter, agencyId: string): Promise<{ data: ILead[]; total: number }> {
    try {
      const { limit, page, sortBy, sortOrder, ...filterQuery } = query;
      const skip = (page - 1) * limit;
      const searchQuery = query.search ? { $text: { $search: query.search as string } } : {};

      const sort = this.getSortOptions(sortBy, sortOrder);

      const [data, total] = await Promise.all([
        this.model
          .find({ ...filterQuery, ...searchQuery, agencyId })
          .select('fullName email status phone alternatePhone createdAt updatedAt source aiScore.value')
          .sort(sort)
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

  async getById(id: string, agencyId: string): Promise<ILead> {
    try {
      const lead = await this.model
        .findOne({ _id: id, agencyId })
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

  async update(id: string, data: ILeadUpdate, agencyId: string): Promise<ILead> {
    try {
      const query: { _id: string; agencyId: string } = { _id: id, agencyId };

      // Remove aiScore from data to avoid conflicts
      const { aiScore: _aiScore, ...restData } = data;

      const updateData = {
        ...restData,
        agencyId,
        $set: {
          'aiScore.value': Number(aiScoreCalculator.calculateScore(data as ILead)),
          'aiScore.lastCalculated': new Date(),
        },
        $inc: {
          'audit.version': 1,
        },
      };

      const updatedLead = await this.model
        .findOneAndUpdate(query, updateData, { new: true })
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

  async delete(id: string, agencyId: string, payload: ILeadUpdate): Promise<ILead> {
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
          { ...payload, $set: { 'audit.isDeleted': true }, $inc: { 'audit.version': 1 } },
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

  async changeStatus(id: string, payload: ILeadUpdate, newStatus: string, agencyId: string): Promise<ILead> {
    try {
      if (!agencyId) {
        throw new BadRequestError('Agency ID is required');
      }
      if (!id) {
        throw new BadRequestError('Lead ID is required');
      }
      if (!newStatus) {
        throw new BadRequestError('New status is required');
      }

      const updatedLead = await this.model
        .findOneAndUpdate(
          { _id: id, agencyId },
          {
            ...payload,
            $set: {
              status: newStatus,
            },
            $inc: {
              'audit.version': 1,
            },
          },
          { new: true },
        )
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
        `Lead status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

export const leadService = new LeadService();
