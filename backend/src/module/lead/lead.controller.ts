import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE } from '../../shared/constant/validation';
import { CreatedSuccess, NoContentSuccess, OkSuccess } from '../../shared/utils/customSuccess';

import { ILeadFilter } from './lead.interface';
import { leadService } from './lead.service';
import { cleanupFile } from './lead.utils';

/**
 * Authentication Controller Class
 * Implements controller layer with proper error handling and response formatting
 */
export class LeadController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.createLead(
        { ...req.body, agencyId: req.user.agency as string },
        req.user.agencyCode as string,
      );
      res.customSuccess(new CreatedSuccess(lead, 'Lead created successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: ILeadFilter = {
        ...req.query,
        agencyId: new Types.ObjectId(req.user.agency as string),
        limit: req.query.limit ? Number.parseInt(req.query.limit as string) : PAGINATION_DEFAULT_LIMIT,
        page: req.query.page ? Number.parseInt(req.query.page as string) : PAGINATION_DEFAULT_PAGE,
      };
      const leads = await leadService.getAll(query, req.user.agency as string);
      res.customSuccess(new OkSuccess(leads, 'Leads fetched successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.getById(req.params.id, req.user.agency as string);
      res.customSuccess(new OkSuccess(lead, 'Lead fetched successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.update(req.params.id, req.body, req.user.agency as string);
      res.customSuccess(new OkSuccess(lead, 'Lead updated successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await leadService.delete(req.params.id, req.user.agency as string, req.body);
      res.customSuccess(new NoContentSuccess('Lead deleted successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lead = await leadService.changeStatus(req.params.id, req.body, req.body.status, req.user.agency as string);
      res.customSuccess(new OkSuccess(lead, 'Lead status changed successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async exportLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filePath = await leadService.exportLeads(req.user.agency as string, req.query);
      setTimeout(() => {
        cleanupFile(filePath);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      }, 1000);
      res.download(filePath);
    } catch (error) {
      next(error);
    }
  }

  async importLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agencyId = '6854fb680f28aae8053e30cd';
      const agencyCode = 'test';

      req.body = {
        ...req.body,
        audit: {
          createdBy: '68550270ab8149571e91cd5a',
          createdAt: new Date(),
          updatedBy: '68550270ab8149571e91cd5a',
          updatedAt: new Date(),
          deletedBy: '68550270ab8149571e91cd5a',
          version: 1,
          isDeleted: false,
        },
      };

      const result = await leadService.importLeads(agencyId, req.body, agencyCode);
      res.customSuccess(new OkSuccess(result, 'Import job queued successfully.'));
    } catch (error) {
      next(error);
    }
  }

  async getImportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // await leadService.getImportStatus(req.params.importId);
      res.customSuccess(new OkSuccess(null, 'Import status fetched successfully.'));
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();
