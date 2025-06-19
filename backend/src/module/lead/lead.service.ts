import fs from 'node:fs';
import path from 'node:path';

import { BATCH_SIZE, EXPORT_LIMIT } from '../../shared/constant/lead';
import { Counter } from '../../shared/models/counter.model';
import { ILead, Lead } from '../../shared/models/lead.model';
import { BaseService } from '../../shared/services/base.service';
import { aiScoreCalculator } from '../../shared/utils/aiScore';
import { BadRequestError, CustomError, InternalServerError, NotFoundError } from '../../shared/utils/customError';
import { LEAD_NUMBER_PAD_LENGTH } from '../../types/enum/lead';

import { ILeadCreate, ILeadFilter, ILeadUpdate } from './lead.interface';
import { cleanupFile, getExportDir, getLeadExportFields, writeCsvHeader, writeCsvRows } from './lead.utils';

export class LeadService extends BaseService<ILead> {
  private readonly UNKNOWN_ERROR = 'Unknown error';

  constructor() {
    super(Lead, 'Lead');
  }

  async createLead(data: ILeadCreate, agencyCode: string): Promise<ILead & { agencyCode: string }> {
    try {
      data.aiScore.value = Number(aiScoreCalculator.calculateScore(data as ILead));

      // Generate lead number if not set
      const currentYear = new Date().getFullYear();
      const counterName = `leadNumber_${data.agencyId}_${currentYear}`;

      const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { value: 1 } },
        { new: true, upsert: true },
      );

      const leadNumber = `${agencyCode}-${currentYear}-${counter.value.toString().padStart(LEAD_NUMBER_PAD_LENGTH, '0')}`;

      return (await this.create({ ...data, leadNumber })) as ILead & { agencyCode: string };
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
        `Failed to fetch leads: ${error instanceof Error ? error.message : this.UNKNOWN_ERROR}`,
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
        `Lead deletion failed: ${error instanceof Error ? error.message : this.UNKNOWN_ERROR}`,
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
        `Lead status update failed: ${error instanceof Error ? error.message : this.UNKNOWN_ERROR}`,
      );
    }
  }

  async exportLeads(agencyId: string, filters: Partial<ILeadFilter> = {}): Promise<string> {
    let filePath = '';
    try {
      const exportDir = getExportDir();
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!fs.existsSync(exportDir)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.mkdirSync(exportDir);
      }
      filePath = path.join(exportDir, `leads-${agencyId}-${Date.now()}.csv`);
      const fields = getLeadExportFields();
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const writable = fs.createWriteStream(filePath);
      writeCsvHeader(writable, fields);
      const mongoFilter = {
        agencyId,
        'audit.isDeleted': { $ne: true },
        ...filters,
      };
      const cursor = this.model
        .find(mongoFilter)
        .select('fullName email status phone alternatePhone createdAt updatedAt source aiScore.value')
        .limit(EXPORT_LIMIT)
        .batchSize(BATCH_SIZE)
        .cursor();
      await writeCsvRows(cursor, writable, fields);
      writable.end();
      await new Promise<void>((resolve, reject) => {
        writable.on('finish', () => resolve());
        writable.on('error', (err) => reject(err));
      });
      return filePath;
    } catch (error) {
      cleanupFile(filePath);
      throw new InternalServerError(
        `Lead export failed: ${error instanceof Error ? error.message : this.UNKNOWN_ERROR}`,
      );
    }
  }
}

export const leadService = new LeadService();
